import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BetaAccessStatus,
  BetaWaitlistStatus,
  FeedbackStatus,
  Prisma,
  SupportRequestStatus,
} from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import { AnalyticsService } from "../analytics/analytics.service";
import type { CreateBetaAccessDto, UpdateBetaAccessDto } from "./dto/beta-access.dto";
import type { CreateBetaCohortDto } from "./dto/cohort.dto";
import type { SubmitFeedbackDto, UpdateFeedbackDto } from "./dto/feedback.dto";
import type { SubmitSupportRequestDto, UpdateSupportRequestDto } from "./dto/support-request.dto";
import type { SubmitBetaWaitlistDto } from "./dto/waitlist.dto";

@Injectable()
export class BetaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async submitWaitlist(dto: SubmitBetaWaitlistDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.betaWaitlistEntry.findUnique({
      select: { id: true, status: true },
      where: { email },
    });

    if (existing) {
      throw new ConflictException("This email is already on the beta waitlist.");
    }

    const entry = await this.prisma.betaWaitlistEntry.create({
      data: {
        email,
        name: dto.name?.trim() || null,
        roleInterest: dto.roleInterest,
        source: dto.source?.trim() || null,
      },
    });

    return {
      id: entry.id,
      status: entry.status,
    };
  }

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
      return { status: null, access: null, activation: await this.getActivationChecklist(userId) };
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

      await this.prisma.betaWaitlistEntry.updateMany({
        data: { status: BetaWaitlistStatus.ACCEPTED },
        where: { email: user.email, status: BetaWaitlistStatus.INVITED },
      });

      return {
        status: accepted.status,
        access: accepted,
        activation: await this.getActivationChecklist(userId),
      };
    }

    return { status: access.status, access, activation: await this.getActivationChecklist(userId) };
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
        ...(dto.cohortId !== undefined ? { cohortId: dto.cohortId } : {}),
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
        cohort: {
          select: { id: true, name: true, targetUsers: true },
        },
        user: {
          select: { email: true, id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async listWaitlist() {
    return this.prisma.betaWaitlistEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async inviteWaitlistEntry(adminId: string, id: string) {
    const entry = await this.prisma.betaWaitlistEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException("Waitlist entry not found.");
    }

    const existingUser = await this.prisma.user.findUnique({
      select: { id: true },
      where: { email: entry.email },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const access = await tx.betaAccess.upsert({
        create: {
          email: entry.email,
          invitedBy: adminId,
          notes: `Invited from first-100 waitlist (${entry.roleInterest}).`,
          status: BetaAccessStatus.INVITED,
          userId: existingUser?.id ?? null,
        },
        update: {
          invitedBy: adminId,
          notes: `Invited from first-100 waitlist (${entry.roleInterest}).`,
          revokedAt: null,
          status: BetaAccessStatus.INVITED,
          ...(existingUser ? { userId: existingUser.id } : {}),
        },
        where: { email: entry.email },
      });

      const waitlist = await tx.betaWaitlistEntry.update({
        data: { status: BetaWaitlistStatus.INVITED },
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          action: "BETA_WAITLIST_INVITED",
          actorId: adminId,
          entity: "BetaWaitlistEntry",
          entityId: id,
          metadata: { betaAccessId: access.id, email: entry.email },
        },
      });

      return { access, waitlist };
    });

    return result;
  }

  async rejectWaitlistEntry(adminId: string, id: string) {
    const entry = await this.prisma.betaWaitlistEntry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException("Waitlist entry not found.");
    }

    if (entry.status === BetaWaitlistStatus.ACCEPTED) {
      throw new BadRequestException("Accepted beta users cannot be rejected from the waitlist.");
    }

    const updated = await this.prisma.betaWaitlistEntry.update({
      data: { status: BetaWaitlistStatus.REJECTED },
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "BETA_WAITLIST_REJECTED",
        actorId: adminId,
        entity: "BetaWaitlistEntry",
        entityId: id,
        metadata: { email: entry.email, previousStatus: entry.status },
      },
    });

    return updated;
  }

  async createCohort(adminId: string, dto: CreateBetaCohortDto) {
    const cohort = await this.prisma.betaCohort.create({
      data: {
        description: dto.description?.trim() || null,
        name: dto.name.trim(),
        targetUsers: dto.targetUsers,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: "BETA_COHORT_CREATED",
        actorId: adminId,
        entity: "BetaCohort",
        entityId: cohort.id,
        metadata: { name: cohort.name, targetUsers: cohort.targetUsers },
      },
    });

    return cohort;
  }

  async listCohorts() {
    return this.prisma.betaCohort.findMany({
      include: {
        _count: {
          select: { betaAccess: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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

  async getFirst100Dashboard() {
    const [
      waitlisted,
      waitlistInvited,
      waitlistAccepted,
      waitlistRejected,
      betaInvited,
      betaAccepted,
      betaRevoked,
      totalSignups,
      onboardingCompleted,
      firstEnrollmentUsers,
      firstLessonCompletionUsers,
      firstAIUsageUsers,
      creatorApplications,
      feedbackSubmitted,
      supportRequests,
      cohorts,
      betaUsers,
    ] = await Promise.all([
      this.prisma.betaWaitlistEntry.count({ where: { status: BetaWaitlistStatus.WAITLISTED } }),
      this.prisma.betaWaitlistEntry.count({ where: { status: BetaWaitlistStatus.INVITED } }),
      this.prisma.betaWaitlistEntry.count({ where: { status: BetaWaitlistStatus.ACCEPTED } }),
      this.prisma.betaWaitlistEntry.count({ where: { status: BetaWaitlistStatus.REJECTED } }),
      this.prisma.betaAccess.count({ where: { status: BetaAccessStatus.INVITED } }),
      this.prisma.betaAccess.count({ where: { status: BetaAccessStatus.ACCEPTED } }),
      this.prisma.betaAccess.count({ where: { status: BetaAccessStatus.REVOKED } }),
      this.prisma.user.count(),
      this.prisma.profile.count({ where: { onboardingCompleted: true } }),
      this.countDistinctEnrollments(),
      this.countDistinctCompletedLessons(),
      this.countDistinctAIUsage(),
      this.prisma.creatorProfile.count(),
      this.prisma.feedback.count(),
      this.prisma.supportRequest.count(),
      this.listCohorts(),
      this.prisma.betaAccess.findMany({
        include: {
          cohort: { select: { id: true, name: true } },
          user: {
            select: {
              email: true,
              id: true,
              name: true,
              profile: { select: { onboardingCompleted: true } },
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        where: { status: BetaAccessStatus.ACCEPTED, userId: { not: null } },
      }),
    ]);

    const progress = await Promise.all(
      betaUsers.map(async (access) => {
        const userId = access.userId;
        if (!userId || !access.user) {
          return null;
        }

        const [firstEnrollment, firstLesson, firstAI, feedback, support, lastActivity] =
          await Promise.all([
            this.prisma.enrollment.findFirst({ select: { id: true }, where: { userId } }),
            this.prisma.lessonProgress.findFirst({
              select: { id: true },
              where: { status: "COMPLETED", userId },
            }),
            this.prisma.aIUsageEvent.findFirst({ select: { id: true }, where: { userId } }),
            this.prisma.feedback.count({ where: { userId } }),
            this.prisma.supportRequest.count({ where: { userId } }),
            this.prisma.userEvent.findFirst({
              orderBy: { createdAt: "desc" },
              select: { createdAt: true, event: true },
              where: { userId },
            }),
          ]);

        return {
          betaAccessId: access.id,
          cohort: access.cohort,
          email: access.email,
          feedbackSubmitted: feedback,
          firstAIMessage: Boolean(firstAI),
          firstCourseEnrollment: Boolean(firstEnrollment),
          firstLessonCompleted: Boolean(firstLesson),
          lastActivity,
          name: access.user.name,
          onboardingCompleted: access.user.profile?.onboardingCompleted ?? false,
          supportRequests: support,
          userId,
          username: access.user.username,
        };
      }),
    );

    return {
      waitlist: {
        accepted: waitlistAccepted,
        invited: waitlistInvited,
        rejected: waitlistRejected,
        total: waitlisted + waitlistInvited + waitlistAccepted + waitlistRejected,
        waitlisted,
      },
      invites: {
        accepted: betaAccepted,
        invited: betaInvited,
        revoked: betaRevoked,
      },
      activation: {
        creatorApplications,
        feedbackSubmitted,
        firstAIMessage: firstAIUsageUsers,
        firstCourseEnrollment: firstEnrollmentUsers,
        firstLessonCompleted: firstLessonCompletionUsers,
        onboardingCompleted,
        signupCount: totalSignups,
        supportRequests,
      },
      rates: {
        creatorApplicationRate: percentage(creatorApplications, totalSignups),
        firstAIMessageRate: percentage(firstAIUsageUsers, totalSignups),
        firstCourseEnrollmentRate: percentage(firstEnrollmentUsers, totalSignups),
        firstLessonCompletionRate: percentage(firstLessonCompletionUsers, totalSignups),
        onboardingCompletionRate: percentage(onboardingCompleted, totalSignups),
        waitlistInviteRate: percentage(
          waitlistInvited + waitlistAccepted,
          waitlisted + waitlistInvited + waitlistAccepted + waitlistRejected,
        ),
      },
      cohorts,
      betaUserProgress: progress.filter((item): item is NonNullable<typeof item> => Boolean(item)),
    };
  }

  private async getActivationChecklist(userId: string) {
    const [profile, firstEnrollment, firstLesson, firstAI, feedback] = await Promise.all([
      this.prisma.profile.findUnique({
        select: { onboardingCompleted: true },
        where: { userId },
      }),
      this.prisma.enrollment.findFirst({ select: { id: true }, where: { userId } }),
      this.prisma.lessonProgress.findFirst({
        select: { id: true },
        where: { status: "COMPLETED", userId },
      }),
      this.prisma.aIUsageEvent.findFirst({ select: { id: true }, where: { userId } }),
      this.prisma.feedback.findFirst({ select: { id: true }, where: { userId } }),
    ]);

    return {
      completeOnboarding: profile?.onboardingCompleted ?? false,
      enrollFirstCourse: Boolean(firstEnrollment),
      completeFirstLesson: Boolean(firstLesson),
      tryAITutor: Boolean(firstAI),
      submitFeedback: Boolean(feedback),
    };
  }

  private async countDistinctEnrollments() {
    return this.prisma.enrollment
      .findMany({ distinct: ["userId"], select: { userId: true } })
      .then((rows) => rows.length);
  }

  private async countDistinctCompletedLessons() {
    return this.prisma.lessonProgress
      .findMany({
        distinct: ["userId"],
        select: { userId: true },
        where: { status: "COMPLETED" },
      })
      .then((rows) => rows.length);
  }

  private async countDistinctAIUsage() {
    return this.prisma.aIUsageEvent
      .findMany({ distinct: ["userId"], select: { userId: true } })
      .then((rows) => rows.length);
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
