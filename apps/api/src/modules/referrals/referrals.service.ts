import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../lib/prisma/prisma.service";
import { PlanCode, ReferralStatus, RewardStatus, SubscriptionStatus } from "@prisma/client";
import { randomBytes } from "crypto";

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateUniqueCode(): string {
    return randomBytes(4).toString("hex").toUpperCase();
  }

  async getMe(userId: string) {
    let referralCode = await this.prisma.referralCode.findUnique({
      where: { userId },
    });

    if (!referralCode) {
      try {
        referralCode = await this.prisma.referralCode.create({
          data: { userId, code: this.generateUniqueCode() },
        });
      } catch (_error) {
        referralCode = await this.prisma.referralCode.create({
          data: { userId, code: this.generateUniqueCode() + "X" },
        });
      }
    }

    const [eventCounts, rewardCounts, activeBenefit] = await Promise.all([
      this.prisma.referralEvent.groupBy({
        by: ["status"],
        where: { inviterUserId: userId },
        _count: { id: true },
      }),
      this.prisma.referralReward.groupBy({
        by: ["status"],
        where: { userId },
        _count: { id: true },
      }),
      this.getActiveBenefit(userId),
    ]);

    let pendingReferrals = 0;
    let successfulReferrals = 0;
    eventCounts.forEach((group) => {
      if (group.status === ReferralStatus.PENDING) pendingReferrals = group._count.id;
      if (group.status === ReferralStatus.COMPLETED) successfulReferrals = group._count.id;
    });

    let pendingRewards = 0;
    let grantedRewards = 0;
    rewardCounts.forEach((group) => {
      if (group.status === RewardStatus.PENDING) pendingRewards = group._count.id;
      if (group.status === RewardStatus.GRANTED) grantedRewards = group._count.id;
    });

    return {
      referralCode: referralCode.code,
      referralLink: `https://learndojoworld.com/r/${referralCode.code}`,
      totalInvites: pendingReferrals + successfulReferrals,
      successfulReferrals,
      pendingReferrals,
      pendingRewards,
      grantedRewards,
      activeBenefit,
    };
  }

  async getStats(userId: string) {
    const [events, rewards] = await Promise.all([
      this.prisma.referralEvent.findMany({
        where: { inviterUserId: userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { invited: { select: { name: true, username: true } } },
      }),
      this.prisma.referralReward.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          referralEvent: {
            include: {
              inviter: { select: { name: true, username: true } },
              invited: { select: { name: true, username: true } },
            },
          },
        },
      }),
    ]);

    return {
      metrics: {
        totalGrantedRewards: rewards.filter((r) => r.status === RewardStatus.GRANTED).length,
      },
      recentEvents: events.map((e) => ({
        id: e.id,
        invitedUser: e.invited.name || e.invited.username,
        status: e.status,
        createdAt: e.createdAt,
      })),
      myRewards: rewards.map((r) => {
        const isInviter = r.referralEvent.inviterUserId === userId;
        const relatedUser = isInviter
          ? r.referralEvent.invited.name || r.referralEvent.invited.username
          : r.referralEvent.inviter.name || r.referralEvent.inviter.username;

        return {
          id: r.id,
          rewardType: r.rewardType,
          rewardValue: r.rewardValue,
          status: r.status,
          createdAt: r.createdAt,
          fulfilledAt: r.fulfilledAt,
          fulfillmentReference: r.fulfillmentReference,
          notes: r.notes,
          relatedUser: relatedUser || "Unknown User",
          role: isInviter ? "Inviter" : "Invitee",
        };
      }),
    };
  }

  async applyReferral(userId: string, codeString: string) {
    const code = await this.prisma.referralCode.findUnique({
      where: { code: codeString },
    });

    if (!code || !code.active) {
      throw new BadRequestException("Invalid or inactive referral code.");
    }

    if (code.userId === userId) {
      throw new BadRequestException("You cannot refer yourself.");
    }

    return this.prisma.$transaction(async (tx) => {
      const existingEvent = await tx.referralEvent.findUnique({
        where: { invitedUserId: userId },
      });

      // Database-level duplicate protection check
      if (existingEvent) {
        throw new ConflictException("You have already applied a referral code.");
      }

      const newEvent = await tx.referralEvent.create({
        data: {
          inviterUserId: code.userId,
          invitedUserId: userId,
          referralCodeId: code.id,
          status: ReferralStatus.PENDING,
        },
      });

      // Reward Creation Logic: Create 7 Days Pro pending rewards for both sides
      await tx.referralReward.createMany({
        data: [
          {
            userId: code.userId,
            referralEventId: newEvent.id,
            rewardType: "PRO_7_DAYS",
            rewardValue: "7",
            status: RewardStatus.PENDING,
          },
          {
            userId: userId,
            referralEventId: newEvent.id,
            rewardType: "PRO_7_DAYS",
            rewardValue: "7",
            status: RewardStatus.PENDING,
          },
        ],
      });

      return {
        message: "Referral applied successfully.",
        eventId: newEvent.id,
        status: newEvent.status,
      };
    });
  }

  private async getActiveBenefit(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      where: {
        currentPeriodEnd: { gt: new Date() },
        plan: { code: { in: [PlanCode.PRO, PlanCode.PREMIUM] } },
        status: SubscriptionStatus.ACTIVE,
        userId,
      },
    });

    if (!subscription) {
      return null;
    }

    return {
      planCode: subscription.plan.code,
      currentPeriodEnd: subscription.currentPeriodEnd,
      source: subscription.plan.code === PlanCode.PRO ? "REFERRAL_OR_PAID_PRO" : "PREMIUM",
    };
  }
}
