import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: { courses: true },
        },
      },
    });
  }

  async getCourses(search?: string, difficulty?: string, category?: string) {
    const difficultyFilter = difficulty?.toUpperCase();
    const where = {
      status: "PUBLISHED" as const,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { subtitle: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(difficultyFilter && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(difficultyFilter)
        ? { difficulty: difficultyFilter as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" }
        : {}),
      ...(category ? { category: { slug: category } } : {}),
    };

    const courses = await this.prisma.course.findMany({
      include: {
        category: true,
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { publishedAt: "desc" },
      where,
    });

    return courses.map((course) => ({
      ...course,
      price: course.price ? Number(course.price) : null,
      moduleCount: course._count.modules,
      enrollmentCount: course._count.enrollments,
      _count: undefined,
    }));
  }

  async getCourseBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      include: {
        category: true,
        modules: {
          include: {
            lessons: {
              orderBy: [{ order: "asc" }],
            },
          },
          orderBy: [{ order: "asc" }],
        },
      },
      where: {
        slug,
        status: "PUBLISHED",
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return {
      ...course,
      price: course.price ? Number(course.price) : null,
    };
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      include: {
        course: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      where: { userId },
    });
  }

  async createEnrollment(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    if (course.status !== "PUBLISHED") {
      throw new ConflictException("This course is not available for enrollment yet.");
    }

    if (!course.isFree) {
      throw new ConflictException("Payments are not enabled yet for paid courses.");
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { courseId, userId } },
    });

    if (existing) {
      throw new ConflictException("You are already enrolled in this course.");
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        courseId,
        progressPercent: 0,
        userId,
      },
      include: {
        course: true,
      },
    });

    await this.analyticsService.trackEvent(userId, "course_enrolled", { courseId });

    return enrollment;
  }

  async getEnrollmentStatus(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { courseId, userId } },
    });

    if (!enrollment) {
      return { enrolled: false, progressPercent: 0 };
    }

    return {
      enrolled: true,
      enrollmentId: enrollment.id,
      progressPercent: Number(enrollment.progressPercent ?? 0),
      completedAt: enrollment.completedAt,
    };
  }
}
