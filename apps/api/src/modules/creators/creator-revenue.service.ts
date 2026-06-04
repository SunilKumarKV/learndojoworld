import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PayoutRequestStatus } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import { CreatePayoutRequestDto } from "./dto/revenue/create-payout-request.dto";
import { UpsertPayoutProfileDto } from "./dto/revenue/upsert-payout-profile.dto";

const RESERVED_PAYOUT_STATUSES = [
  PayoutRequestStatus.PENDING,
  PayoutRequestStatus.APPROVED,
  PayoutRequestStatus.PAID,
];

@Injectable()
export class CreatorRevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenue(userId: string) {
    const creator = await this.getCreatorProfile(userId);
    const earnings = await this.prisma.creatorEarning.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      where: { creatorId: creator.id },
    });

    const currency = earnings[0]?.currency ?? "INR";
    const totalRevenue = earnings.reduce((sum, earning) => sum + earning.creatorAmount, 0);
    const paidRevenue = await this.sumPayoutRequests(creator.id, currency, [
      PayoutRequestStatus.PAID,
    ]);
    const reservedRevenue = await this.sumPayoutRequests(creator.id, currency, [
      PayoutRequestStatus.PENDING,
      PayoutRequestStatus.APPROVED,
      PayoutRequestStatus.PAID,
    ]);
    const totalEnrollments = await this.prisma.enrollment.count({
      where: {
        course: {
          creatorId: creator.userId,
        },
      },
    });

    const topCourses = this.buildTopCourses(earnings).slice(0, 5);

    return {
      paidRevenue: { amount: paidRevenue, currency },
      pendingRevenue: { amount: Math.max(totalRevenue - reservedRevenue, 0), currency },
      recentEarnings: earnings.slice(0, 10).map((earning) => ({
        course: earning.course,
        createdAt: earning.createdAt,
        creatorAmount: earning.creatorAmount,
        currency: earning.currency,
        grossAmount: earning.grossAmount,
        id: earning.id,
        platformFee: earning.platformFee,
      })),
      topCourses,
      totalEnrollments,
      totalRevenue: { amount: totalRevenue, currency },
    };
  }

  async getPayoutProfile(userId: string) {
    const creator = await this.getCreatorProfile(userId);

    return this.prisma.payoutProfile.findUnique({
      where: { creatorId: creator.id },
    });
  }

  async upsertPayoutProfile(userId: string, dto: UpsertPayoutProfileDto) {
    const creator = await this.getCreatorProfile(userId);
    const payoutData = {
      accountLast4: dto.accountLast4 ?? null,
      bankName: dto.bankName ?? null,
      country: dto.country,
      legalName: dto.legalName,
      paypalEmail: dto.paypalEmail ?? null,
      payoutMethod: dto.payoutMethod,
      upiId: dto.upiId ?? null,
    };

    return this.prisma.payoutProfile.upsert({
      create: {
        ...payoutData,
        creatorId: creator.id,
      },
      update: payoutData,
      where: { creatorId: creator.id },
    });
  }

  async createPayoutRequest(userId: string, dto: CreatePayoutRequestDto) {
    const creator = await this.getCreatorProfile(userId);
    const currency = dto.currency.toUpperCase();
    const availableAmount = await this.getAvailablePayoutAmount(creator.id, currency);

    if (dto.amount > availableAmount) {
      throw new BadRequestException("Payout amount exceeds available unpaid earnings.");
    }

    return this.prisma.payoutRequest.create({
      data: {
        amount: dto.amount,
        creatorId: creator.id,
        currency,
        status: PayoutRequestStatus.PENDING,
      },
    });
  }

  async getPayoutRequests(userId: string) {
    const creator = await this.getCreatorProfile(userId);

    return this.prisma.payoutRequest.findMany({
      orderBy: { createdAt: "desc" },
      where: { creatorId: creator.id },
    });
  }

  private async getCreatorProfile(userId: string) {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    if (!creator) {
      throw new NotFoundException("Creator profile not found.");
    }

    return creator;
  }

  private async getAvailablePayoutAmount(creatorId: string, currency: string) {
    const [earningsTotal, reservedTotal] = await Promise.all([
      this.sumCreatorEarnings(creatorId, currency),
      this.sumPayoutRequests(creatorId, currency, RESERVED_PAYOUT_STATUSES),
    ]);

    return Math.max(earningsTotal - reservedTotal, 0);
  }

  private async sumCreatorEarnings(creatorId: string, currency: string) {
    const result = await this.prisma.creatorEarning.aggregate({
      _sum: { creatorAmount: true },
      where: { creatorId, currency },
    });

    return result._sum.creatorAmount ?? 0;
  }

  private async sumPayoutRequests(
    creatorId: string,
    currency: string,
    statuses: PayoutRequestStatus[],
  ) {
    const result = await this.prisma.payoutRequest.aggregate({
      _sum: { amount: true },
      where: {
        creatorId,
        currency,
        status: { in: statuses },
      },
    });

    return result._sum.amount ?? 0;
  }

  private buildTopCourses(
    earnings: Array<{
      course: { id: string; title: string };
      courseId: string;
      creatorAmount: number;
      currency: string;
      grossAmount: number;
      platformFee: number;
    }>,
  ) {
    const grouped = new Map<
      string,
      {
        course: { id: string; title: string };
        creatorAmount: number;
        currency: string;
        grossAmount: number;
        platformFee: number;
        salesCount: number;
      }
    >();

    for (const earning of earnings) {
      const existing = grouped.get(earning.courseId);

      if (existing) {
        existing.creatorAmount += earning.creatorAmount;
        existing.grossAmount += earning.grossAmount;
        existing.platformFee += earning.platformFee;
        existing.salesCount += 1;
        continue;
      }

      grouped.set(earning.courseId, {
        course: earning.course,
        creatorAmount: earning.creatorAmount,
        currency: earning.currency,
        grossAmount: earning.grossAmount,
        platformFee: earning.platformFee,
        salesCount: 1,
      });
    }

    return [...grouped.values()].sort((left, right) => {
      if (right.creatorAmount !== left.creatorAmount) {
        return right.creatorAmount - left.creatorAmount;
      }

      return right.salesCount - left.salesCount;
    });
  }
}
