import { Injectable, NotFoundException } from "@nestjs/common";
import { BetaAccessStatus, FeedbackStatus, Prisma, SupportRequestStatus } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";
import type { CreateBetaAccessDto, UpdateBetaAccessDto } from "./dto/beta-access.dto";
import type { SubmitFeedbackDto, UpdateFeedbackDto } from "./dto/feedback.dto";
import type { SubmitSupportRequestDto, UpdateSupportRequestDto } from "./dto/support-request.dto";

@Injectable()
export class BetaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getMyBetaAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      select: { email: true, id: true },
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    const access = await this.prisma.betaAccess.findFirst({
      where: {
        OR: [{ userId }, { email: user.email }],
      },
    });

    if (!access) {
      return { status: null, access: null };
    }

    if (
      access.status === BetaAccessStatus.INVITED &&
      (!access.userId || access.userId === userId)
    ) {
      const accepted = await this.prisma.betaAccess.update({
        data: {
          acceptedAt: new Date(),
          status: BetaAccessStatus.ACCEPTED,
          userId,
        },
        where: { id: access.id },
      });

      return { status: accepted.status, access: accepted };
    }

    return { status: access.status, access };
  }

  async submitFeedback(userId: string, dto: SubmitFeedbackDto) {
    const feedback = await this.prisma.feedback.create({
      data: {
        message: dto.message.trim(),
        path: dto.path?.trim() || null,
        type: dto.type,
        userId,
      },
    });

    await this.analyticsService.trackEvent(userId, "beta_feedback_submitted", {
      feedbackId: feedback.id,
      type: feedback.type,
    });

    return feedback;
  }

  async submitSupportRequest(userId: string, dto: SubmitSupportRequestDto) {
    const request = await this.prisma.supportRequest.create({
      data: {
        message: dto.message.trim(),
        path: dto.path?.trim() || null,
        subject: dto.subject.trim(),
        userId,
      },
    });

    await this.analyticsService.trackEvent(userId, "support_request_submitted", {
      supportRequestId: request.id,
    });

    return request;
  }

  async createBetaAccess(adminId: string, dto: CreateBetaAccessDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      select: { id: true },
      where: { email },
    });

    const access = await this.prisma.betaAccess.upsert({
      create: {
        email,
        invitedBy: adminId,
        notes: dto.notes?.trim() || null,
        status: BetaAccessStatus.INVITED,
        userId: existingUser?.id ?? null,
      },
      update: {
        invitedBy: adminId,
        notes: dto.notes?.trim() || null,
        revokedAt: null,
        status: BetaAccessStatus.INVITED,
        ...(existingUser ? { userId: existingUser.id } : {}),
      },
      where: { email },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "BETA_ACCESS_INVITED",
        actorId: adminId,
        entity: "BetaAccess",
        entityId: access.id,
        metadata: { email },
      },
    });

    return access;
  }

  async updateBetaAccess(adminId: string, id: string, dto: UpdateBetaAccessDto) {
    const existing = await this.prisma.betaAccess.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Beta access record not found.");
    }

    const now = new Date();
    const updated = await this.prisma.betaAccess.update({
      data: {
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        ...(dto.userId !== undefined ? { userId: dto.userId } : {}),
        ...(dto.status !== undefined
          ? {
              acceptedAt:
                dto.status === BetaAccessStatus.ACCEPTED
                  ? (existing.acceptedAt ?? now)
                  : existing.acceptedAt,
              revokedAt: dto.status === BetaAccessStatus.REVOKED ? now : null,
              status: dto.status,
            }
          : {}),
      },
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "BETA_ACCESS_UPDATED",
        actorId: adminId,
        entity: "BetaAccess",
        entityId: id,
        metadata: {
          previousStatus: existing.status,
          nextStatus: updated.status,
        },
      },
    });

    return updated;
  }

  async listBetaAccess() {
    return this.prisma.betaAccess.findMany({
      include: {
        user: {
          select: { email: true, id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async listFeedback(status?: FeedbackStatus) {
    return this.prisma.feedback.findMany({
      include: {
        user: {
          select: { email: true, id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      ...(status ? { where: { status } } : {}),
    });
  }

  async updateFeedback(adminId: string, id: string, dto: UpdateFeedbackDto) {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Feedback not found.");
    }

    const updated = await this.prisma.feedback.update({
      data: {
        ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      where: { id },
    });

    await this.createAdminReviewAudit(adminId, "BETA_FEEDBACK_UPDATED", "Feedback", id, {
      previousStatus: existing.status,
      nextStatus: updated.status,
    });

    return updated;
  }

  async listSupportRequests(status?: SupportRequestStatus) {
    return this.prisma.supportRequest.findMany({
      include: {
        user: {
          select: { email: true, id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      ...(status ? { where: { status } } : {}),
    });
  }

  async updateSupportRequest(adminId: string, id: string, dto: UpdateSupportRequestDto) {
    const existing = await this.prisma.supportRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Support request not found.");
    }

    const updated = await this.prisma.supportRequest.update({
      data: {
        ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      where: { id },
    });

    await this.createAdminReviewAudit(adminId, "SUPPORT_REQUEST_UPDATED", "SupportRequest", id, {
      previousStatus: existing.status,
      nextStatus: updated.status,
    });

    return updated;
  }

  async getBetaDashboard() {
    const now = Date.now();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );

    const [
      totalBetaUsers,
      activeBetaUsers,
      feedbackCount,
      openFeedbackCount,
      supportTicketCount,
      openSupportTicketCount,
      aiUsage,
      enrollments,
      creatorApplications,
      totalSignups,
      onboardingCompleted,
      firstEnrollmentUsers,
      firstLessonCompletionUsers,
      firstAIUsageUsers,
    ] = await Promise.all([
      this.prisma.betaAccess.count({ where: { status: BetaAccessStatus.ACCEPTED } }),
      this.prisma.userEvent
        .findMany({
          distinct: ["userId"],
          select: { userId: true },
          where: {
            createdAt: { gte: last7Days },
            user: { betaAccess: { status: BetaAccessStatus.ACCEPTED } },
          },
        })
        .then((rows) => rows.length),
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.OPEN } }),
      this.prisma.supportRequest.count(),
      this.prisma.supportRequest.count({ where: { status: SupportRequestStatus.OPEN } }),
      this.prisma.aIUsageEvent.aggregate({
        _sum: { messagesUsed: true, tokensUsed: true },
        where: { date: todayUtc },
      }),
      this.prisma.enrollment.count(),
      this.prisma.creatorProfile.count(),
      this.prisma.user.count(),
      this.prisma.profile.count({ where: { onboardingCompleted: true } }),
      this.prisma.enrollment
        .findMany({ distinct: ["userId"], select: { userId: true } })
        .then((rows) => rows.length),
      this.prisma.lessonProgress
        .findMany({
          distinct: ["userId"],
          select: { userId: true },
          where: { status: "COMPLETED" },
        })
        .then((rows) => rows.length),
      this.prisma.aIUsageEvent
        .findMany({ distinct: ["userId"], select: { userId: true } })
        .then((rows) => rows.length),
    ]);

    return {
      beta: {
        activeBetaUsers,
        totalBetaUsers,
      },
      feedback: {
        open: openFeedbackCount,
        total: feedbackCount,
      },
      support: {
        open: openSupportTicketCount,
        total: supportTicketCount,
      },
      product: {
        aiMessagesToday: aiUsage._sum.messagesUsed ?? 0,
        aiTokensToday: aiUsage._sum.tokensUsed ?? 0,
        creatorApplications,
        enrollments,
      },
      funnel: {
        creatorApplicationRate: percentage(creatorApplications, totalSignups),
        firstAIUsageRate: percentage(firstAIUsageUsers, totalSignups),
        firstCourseEnrollmentRate: percentage(firstEnrollmentUsers, totalSignups),
        firstLessonCompletionRate: percentage(firstLessonCompletionUsers, totalSignups),
        onboardingCompletionRate: percentage(onboardingCompleted, totalSignups),
        signupConversion: {
          acceptedBetaUsers: totalBetaUsers,
          totalSignups,
        },
      },
      goals: {
        aiSessionsPerDay: 50,
        betaUsers: 50,
        creators: 10,
        lessonsCompleted: 1000,
        publishedCourses: 25,
      },
    };
  }

  private async createAdminReviewAudit(
    adminId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        actorId: adminId,
        entity,
        entityId,
        metadata,
      },
    });
  }
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
