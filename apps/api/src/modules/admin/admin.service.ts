import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [pendingCourses, publishedCourses, rejectedCourses, totalUsers] = await Promise.all([
      this.prisma.course.count({ where: { status: "PENDING_REVIEW" } }),
      this.prisma.course.count({ where: { status: "PUBLISHED" } }),
      this.prisma.course.count({ where: { status: "REJECTED" } }),
      this.prisma.user.count(),
    ]);

    return {
      pendingCourses,
      publishedCourses,
      rejectedCourses,
      totalUsers,
    };
  }

  async getPendingCourses() {
    return this.prisma.course.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        creator: { select: { id: true, name: true, username: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getCourseReviewDetail(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        creator: { select: { id: true, name: true, username: true, email: true } },
        modules: {
          include: {
            lessons: {
              orderBy: [{ order: "asc" }],
            },
          },
          orderBy: [{ order: "asc" }],
        },
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found.");
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entity: "course",
        entityId: courseId,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      ...course,
      auditLogs,
    };
  }

  async approveCourse(actorId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException("Course not found.");
    }

    if (course.status !== "PENDING_REVIEW") {
      throw new ConflictException("Only pending review courses can be approved.");
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await this.createAuditLog(actorId, "course_approved", "course", courseId, {
      title: course.title,
      previousStatus: course.status,
    });

    return updatedCourse;
  }

  async rejectCourse(actorId: string, courseId: string, reason: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException("Course not found.");
    }

    if (course.status !== "PENDING_REVIEW") {
      throw new ConflictException("Only pending review courses can be rejected.");
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: "REJECTED",
        publishedAt: null,
      },
    });

    await this.createAuditLog(actorId, "course_rejected", "course", courseId, {
      title: course.title,
      previousStatus: course.status,
      reason,
    });

    return updatedCourse;
  }

  private async createAuditLog(
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        entity,
        entityId,
        ...(metadata === undefined ? {} : { metadata }),
      },
    });
  }
}
