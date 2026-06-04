import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../lib/prisma/prisma.service";
import { ReferralStatus } from "@prisma/client";
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
          data: {
            userId,
            code: this.generateUniqueCode(),
          },
        });
      } catch (_error) {
        referralCode = await this.prisma.referralCode.create({
          data: { userId, code: this.generateUniqueCode() + "X" },
        });
      }
    }

    const eventCounts = await this.prisma.referralEvent.groupBy({
      by: ["status"],
      where: { inviterUserId: userId },
      _count: { id: true },
    });

    let pendingReferrals = 0;
    let successfulReferrals = 0;

    eventCounts.forEach((group) => {
      if (group.status === ReferralStatus.PENDING) pendingReferrals = group._count.id;
      if (group.status === ReferralStatus.COMPLETED) successfulReferrals = group._count.id;
    });

    return {
      referralCode: referralCode.code,
      referralLink: `https://learndojoworld.com/r/${referralCode.code}`,
      totalInvites: pendingReferrals + successfulReferrals,
      successfulReferrals,
      pendingReferrals,
    };
  }

  async getStats(userId: string) {
    const [events, rewardsCount] = await Promise.all([
      this.prisma.referralEvent.findMany({
        where: { inviterUserId: userId },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          invited: { select: { name: true, username: true } },
          reward: { select: { status: true, rewardValue: true } },
        },
      }),
      this.prisma.referralReward.count({
        where: { userId, status: "GRANTED" },
      }),
    ]);

    return {
      metrics: {
        totalGrantedRewards: rewardsCount,
      },
      recentEvents: events.map((e) => ({
        id: e.id,
        invitedUser: e.invited.name || e.invited.username,
        status: e.status,
        rewardStatus: e.reward?.status || null,
        createdAt: e.createdAt,
      })),
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

      return {
        message: "Referral applied successfully.",
        eventId: newEvent.id,
        status: newEvent.status,
      };
    });
  }
}
