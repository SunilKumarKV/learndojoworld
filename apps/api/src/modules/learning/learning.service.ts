import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessonById(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const isEnrolled = await this.hasEnrollment(userId, lesson.module.courseId);
    if (!lesson.isPreview && !isEnrolled) {
      throw new ForbiddenException("You must enroll in this course before accessing the lesson.");
    }

    return {
      ...lesson,
      course: lesson.module.course,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        order: lesson.module.order,
      },
    };
  }

  async startLesson(userId: string, lessonId: string) {
    const lesson = await this.ensureLessonAccess(userId, lessonId);

    const progress = await this.prisma.lessonProgress.upsert({
      create: {
        courseId: lesson.module.courseId,
        lessonId,
        status: "IN_PROGRESS",
        userId,
        watchedSec: 0,
      },
      update: {
        status: "IN_PROGRESS",
        lastActivityAt: new Date(),
      },
      where: { userId_lessonId: { lessonId, userId } },
    });

    await this.recordActivity(userId, "LESSON_STARTED", lessonId, lesson.module.courseId);

    await this.syncEnrollmentProgress(userId, lesson.module.courseId);

    return { ...progress, lessonId, courseId: lesson.module.courseId };
  }

  async watchLesson(userId: string, lessonId: string, watchedSec: number, completed = false) {
    const lesson = await this.ensureLessonAccess(userId, lessonId);

    const current = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { lessonId, userId } },
    });

    const safeWatchedSec = Math.max(0, watchedSec);
    const duration = lesson.durationSec ?? 0;
    const computedProgress =
      duration > 0 ? Math.min(100, Math.round((safeWatchedSec / duration) * 100)) : 0;

    const progress = await this.prisma.lessonProgress.upsert({
      create: {
        courseId: lesson.module.courseId,
        lessonId,
        status: completed ? "COMPLETED" : "IN_PROGRESS",
        userId,
        watchedSec: safeWatchedSec,
      },
      update: {
        lastActivityAt: new Date(),
        status: completed
          ? "COMPLETED"
          : current?.status === "COMPLETED"
            ? "COMPLETED"
            : "IN_PROGRESS",
        watchedSec: Math.max(current?.watchedSec ?? 0, safeWatchedSec),
        completedAt: completed ? new Date() : (current?.completedAt ?? null),
      },
      where: { userId_lessonId: { lessonId, userId } },
    });

    if (completed) {
      await this.recordActivity(userId, "LESSON_COMPLETED", lessonId, lesson.module.courseId, {
        progressPercent: computedProgress,
      });
    } else {
      await this.recordActivity(userId, "LESSON_WATCHED", lessonId, lesson.module.courseId, {
        progressPercent: computedProgress,
        watchedSec: safeWatchedSec,
      });
    }

    await this.syncEnrollmentProgress(userId, lesson.module.courseId);

    return {
      ...progress,
      progressPercent: computedProgress,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.ensureLessonAccess(userId, lessonId);
    const duration = lesson.durationSec ?? 0;

    const progress = await this.prisma.lessonProgress.upsert({
      create: {
        courseId: lesson.module.courseId,
        lessonId,
        status: "COMPLETED",
        userId,
        watchedSec: duration > 0 ? duration : 100,
      },
      update: {
        completedAt: new Date(),
        lastActivityAt: new Date(),
        status: "COMPLETED",
        watchedSec: Math.max(lesson.durationSec ?? 0, 0),
      },
      where: { userId_lessonId: { lessonId, userId } },
    });

    await this.recordActivity(userId, "LESSON_COMPLETED", lessonId, lesson.module.courseId, {
      progressPercent: 100,
    });

    await this.syncEnrollmentProgress(userId, lesson.module.courseId);

    return {
      ...progress,
      progressPercent: 100,
    };
  }

  async getCourseProgress(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { courseId, userId } },
    });

    if (!enrollment) {
      throw new ForbiddenException("You must enroll in this course to view progress.");
    }

    const totalLessons = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        courseId,
        status: "COMPLETED",
        userId,
      },
    });

    const lessonProgress = await this.prisma.lessonProgress.findMany({
      include: {
        lesson: true,
      },
      orderBy: { lastActivityAt: "desc" },
      where: { courseId, userId },
    });

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      completedLessons,
      courseId,
      lessonProgress: lessonProgress.map((item) => ({
        ...item,
        lesson: { id: item.lesson.id, title: item.lesson.title, slug: item.lesson.slug },
      })),
      progressPercent,
      totalLessons,
    };
  }

  async getContinueLearning(userId: string) {
    const latest = await this.prisma.lessonProgress.findFirst({
      include: {
        course: true,
        lesson: true,
      },
      orderBy: { lastActivityAt: "desc" },
      where: { userId },
    });

    if (!latest) {
      return null;
    }

    const totalLessons = await this.prisma.lesson.count({
      where: { module: { courseId: latest.courseId } },
    });
    const progressPercent =
      totalLessons > 0
        ? Math.round(
            ((await this.prisma.lessonProgress.count({
              where: { courseId: latest.courseId, status: "COMPLETED", userId },
            })) /
              totalLessons) *
              100,
          )
        : 0;

    return {
      courseId: latest.courseId,
      courseTitle: latest.course.title,
      lessonId: latest.lessonId,
      lessonTitle: latest.lesson.title,
      progressPercent,
      status: latest.status,
      updatedAt: latest.lastActivityAt,
    };
  }

  private async ensureLessonAccess(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const isEnrolled = await this.hasEnrollment(userId, lesson.module.courseId);
    if (!lesson.isPreview && !isEnrolled) {
      throw new ForbiddenException("You must enroll in this course before accessing this lesson.");
    }

    return lesson;
  }

  private async hasEnrollment(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { courseId, userId } },
    });

    return Boolean(enrollment);
  }

  private async syncEnrollmentProgress(userId: string, courseId: string) {
    const totalLessons = await this.prisma.lesson.count({
      where: { module: { courseId } },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: { courseId, status: "COMPLETED", userId },
    });

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    await this.prisma.enrollment.updateMany({
      data: { progressPercent },
      where: { courseId, userId },
    });

    if (progressPercent >= 100) {
      await this.prisma.enrollment.updateMany({
        data: { completedAt: new Date() },
        where: { courseId, userId, completedAt: null },
      });
    }
  }

  private async recordActivity(
    userId: string,
    type: "LESSON_STARTED" | "LESSON_WATCHED" | "LESSON_COMPLETED",
    lessonId: string,
    courseId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.learningActivity.create({
      data: {
        lessonId,
        metadata: (metadata ?? null) as Prisma.InputJsonValue,
        type,
        userId,
        courseId,
      },
    });
  }
}
