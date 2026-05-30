import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(userId: string, event: string, metadata: Record<string, unknown> = {}) {
    return this.prisma.userEvent.create({
      data: {
        event,
        metadata: metadata as Prisma.InputJsonValue,
        userId,
      },
    });
  }

  async getFounderMetrics(_userId: string) {
    const [totalUsers, enrollments, lessonsCompleted, quizzesCompleted, flashcardsReviewed] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.enrollment.count(),
        this.prisma.lessonProgress.count({ where: { status: "COMPLETED" } }),
        this.prisma.quizAttempt.count(),
        this.prisma.flashcardReview.count(),
      ]);

    const [activeUsers7d, activeUsers30d, onboardingUsers, totalProfiles] = await Promise.all([
      this.prisma.userEvent.findMany({
        distinct: ["userId"],
        select: { userId: true },
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.userEvent.findMany({
        distinct: ["userId"],
        select: { userId: true },
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.profile.count({ where: { onboardingCompleted: true } }),
      this.prisma.profile.count(),
    ]);

    const averageSessionTime = await this.prisma.learningActivity.aggregate({
      _avg: { durationMinutes: true },
      where: { durationMinutes: { gt: 0 } },
    });

    return {
      activeUsers30d: activeUsers30d.length,
      activeUsers7d: activeUsers7d.length,
      averageSessionTime: Math.round(Number(averageSessionTime._avg.durationMinutes ?? 0)),
      enrollments,
      flashcardsReviewed,
      lessonsCompleted,
      onboardingCompletionRate:
        totalProfiles > 0 ? Math.round((onboardingUsers / totalProfiles) * 100) : 0,
      quizzesCompleted,
      totalUsers,
    };
  }
}
