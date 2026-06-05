import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import {
  PlanCode,
  RewardStatus,
  PayoutRequestStatus,
  SubscriptionStatus,
  type Prisma,
} from "@prisma/client";

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

  async getPayoutRequests() {
    return this.prisma.payoutRequest.findMany({
      include: {
        creator: {
          include: {
            payoutProfile: true,
            user: {
              select: {
                email: true,
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async approvePayoutRequest(actorId: string, payoutRequestId: string) {
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutRequestId },
    });

    if (!payoutRequest) {
      throw new NotFoundException("Payout request not found.");
    }

    if (payoutRequest.status !== PayoutRequestStatus.PENDING) {
      throw new ConflictException("Only pending payout requests can be approved.");
    }

    const updatedPayoutRequest = await this.prisma.payoutRequest.update({
      data: { status: PayoutRequestStatus.APPROVED },
      where: { id: payoutRequestId },
    });

    await this.createAuditLog(
      actorId,
      "payout_request_approved",
      "payout_request",
      payoutRequestId,
      {
        amount: payoutRequest.amount,
        creatorId: payoutRequest.creatorId,
        currency: payoutRequest.currency,
        previousStatus: payoutRequest.status,
      },
    );

    return updatedPayoutRequest;
  }

  async rejectPayoutRequest(actorId: string, payoutRequestId: string, notes: string) {
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutRequestId },
    });

    if (!payoutRequest) {
      throw new NotFoundException("Payout request not found.");
    }

    if (payoutRequest.status !== PayoutRequestStatus.PENDING) {
      throw new ConflictException("Only pending payout requests can be rejected.");
    }

    const updatedPayoutRequest = await this.prisma.payoutRequest.update({
      data: {
        notes,
        status: PayoutRequestStatus.REJECTED,
      },
      where: { id: payoutRequestId },
    });

    await this.createAuditLog(
      actorId,
      "payout_request_rejected",
      "payout_request",
      payoutRequestId,
      {
        amount: payoutRequest.amount,
        creatorId: payoutRequest.creatorId,
        currency: payoutRequest.currency,
        notes,
        previousStatus: payoutRequest.status,
      },
    );

    return updatedPayoutRequest;
  }

  // ==========================================
  // REFERRALS & REWARDS
  // ==========================================

  async getReferrals() {
    const [events, rewards] = await Promise.all([
      this.prisma.referralEvent.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          inviter: { select: { id: true, name: true, email: true } },
          invited: { select: { id: true, name: true, email: true } },
          referralCode: true,
        },
      }),
      this.prisma.referralReward.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          referralEvent: {
            include: {
              inviter: { select: { name: true, email: true } },
              invited: { select: { name: true, email: true } },
            },
          },
        },
      }),
    ]);
    return { events, rewards };
  }

  async approveReward(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reward = await tx.referralReward.findUnique({ where: { id } });
      if (!reward) throw new NotFoundException("Reward not found.");

      if (reward.status !== RewardStatus.PENDING) {
        throw new BadRequestException("Only PENDING rewards can be approved.");
      }

      const updated = await tx.referralReward.update({
        where: { id },
        data: { status: RewardStatus.APPROVED },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: "APPROVE_REFERRAL_REWARD",
          entity: "ReferralReward",
          entityId: id,
          metadata: { previousStatus: reward.status, newStatus: RewardStatus.APPROVED },
        },
      });

      return updated;
    });
  }

  async rejectReward(id: string, reason: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reward = await tx.referralReward.findUnique({ where: { id } });
      if (!reward) throw new NotFoundException("Reward not found.");

      if (reward.status === RewardStatus.REJECTED || reward.status === RewardStatus.GRANTED) {
        throw new BadRequestException(
          "Cannot reject a reward that is already finalized (GRANTED or REJECTED).",
        );
      }

      const updated = await tx.referralReward.update({
        where: { id },
        data: { status: RewardStatus.REJECTED, notes: reason },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: "REJECT_REFERRAL_REWARD",
          entity: "ReferralReward",
          entityId: id,
          metadata: { previousStatus: reward.status, newStatus: RewardStatus.REJECTED, reason },
        },
      });

      return updated;
    });
  }

  async grantReward(id: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reward = await tx.referralReward.findUnique({
        include: {
          user: { select: { id: true, email: true } },
        },
        where: { id },
      });
      if (!reward) throw new NotFoundException("Reward not found.");

      if (reward.status === RewardStatus.GRANTED || reward.fulfilledAt) {
        throw new BadRequestException("Reward has already been granted.");
      }

      if (reward.status !== RewardStatus.APPROVED) {
        throw new BadRequestException("Only APPROVED rewards can be granted.");
      }

      const claimed = await tx.referralReward.updateMany({
        data: {
          notes: "Reward fulfillment in progress.",
        },
        where: {
          fulfilledAt: null,
          id,
          status: RewardStatus.APPROVED,
        },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException("Reward has already been granted.");
      }

      const days = this.resolveReferralRewardDays(reward.rewardType, reward.rewardValue);
      const fulfillment = await this.fulfillProReferralReward(tx, reward.userId, days, id);

      const updated = await tx.referralReward.update({
        where: { id },
        data: {
          fulfilledAt: fulfillment.fulfilledAt,
          fulfillmentReference: fulfillment.reference,
          notes: fulfillment.notes,
          status: RewardStatus.GRANTED,
        },
      });

      await tx.referralEvent.update({
        data: { status: "COMPLETED" },
        where: { id: reward.referralEventId },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: "GRANT_REFERRAL_REWARD",
          entity: "ReferralReward",
          entityId: id,
          metadata: {
            previousStatus: reward.status,
            newStatus: RewardStatus.GRANTED,
            rewardType: reward.rewardType,
            rewardValue: reward.rewardValue,
            userId: reward.userId,
            fulfillmentReference: fulfillment.reference,
            fulfillmentAction: fulfillment.action,
            previousPlanCode: fulfillment.previousPlanCode,
            resultingPlanCode: fulfillment.resultingPlanCode,
            currentPeriodEnd: fulfillment.currentPeriodEnd?.toISOString() ?? null,
          },
        },
      });

      return updated;
    });
  }

  private resolveReferralRewardDays(rewardType: string, rewardValue: string) {
    const days = Number(rewardValue);

    if (rewardType !== "PRO_7_DAYS" || !Number.isInteger(days) || days !== 7) {
      throw new BadRequestException("Unsupported referral reward type.");
    }

    return days;
  }

  private async fulfillProReferralReward(
    tx: Prisma.TransactionClient,
    userId: string,
    days: number,
    rewardId: string,
  ) {
    const now = new Date();
    const fulfilledAt = now;
    const proPlan = await tx.plan.findUnique({ where: { code: PlanCode.PRO } });
    const premiumPlan = await tx.plan.findUnique({ where: { code: PlanCode.PREMIUM } });

    if (!proPlan || !premiumPlan) {
      throw new NotFoundException("Referral reward plans are not configured.");
    }

    const activePaidSubscription = await tx.subscription.findFirst({
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      where: {
        currentPeriodEnd: { gt: now },
        plan: { code: { in: [PlanCode.PRO, PlanCode.PREMIUM] } },
        status: SubscriptionStatus.ACTIVE,
        userId,
      },
    });

    if (activePaidSubscription?.plan.code === PlanCode.PREMIUM) {
      return {
        action: "PREMIUM_PRESERVED",
        currentPeriodEnd: activePaidSubscription.currentPeriodEnd,
        fulfilledAt,
        notes: "Reward fulfilled; existing Premium access preserved.",
        previousPlanCode: PlanCode.PREMIUM,
        reference: `referral:${rewardId}:premium-preserved:${activePaidSubscription.id}`,
        resultingPlanCode: PlanCode.PREMIUM,
      };
    }

    const extensionBase =
      activePaidSubscription?.plan.code === PlanCode.PRO &&
      activePaidSubscription.currentPeriodEnd > now
        ? activePaidSubscription.currentPeriodEnd
        : now;
    const currentPeriodEnd = this.addDays(extensionBase, days);

    if (activePaidSubscription?.plan.code === PlanCode.PRO) {
      const updatedSubscription = await tx.subscription.update({
        data: {
          currentPeriodEnd,
        },
        where: { id: activePaidSubscription.id },
      });

      return {
        action: "PRO_EXTENDED",
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        fulfilledAt,
        notes: `Reward fulfilled; Pro access extended by ${days} days.`,
        previousPlanCode: PlanCode.PRO,
        reference: `referral:${rewardId}:pro-extended:${updatedSubscription.id}`,
        resultingPlanCode: PlanCode.PRO,
      };
    }

    const createdSubscription = await tx.subscription.create({
      data: {
        currentPeriodEnd,
        currentPeriodStart: now,
        planId: proPlan.id,
        status: SubscriptionStatus.ACTIVE,
        userId,
      },
    });

    return {
      action: "PRO_ACTIVATED",
      currentPeriodEnd: createdSubscription.currentPeriodEnd,
      fulfilledAt,
      notes: `Reward fulfilled; Pro access activated for ${days} days.`,
      previousPlanCode: PlanCode.FREE,
      reference: `referral:${rewardId}:pro-activated:${createdSubscription.id}`,
      resultingPlanCode: PlanCode.PRO,
    };
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);

    return next;
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
