import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PaymentGateway, Plan, PlanCode, Subscription, SubscriptionStatus } from "@prisma/client";

import { PrismaService } from "../../lib/prisma/prisma.service";
import { PaymentsService } from "../payments/payments.service";
import { BillingGateway, BillingInterval, SubscribeDto } from "./dto/subscribe.dto";

type SubscriptionWithPlan = Subscription & {
  plan: Plan;
};

export type AIUsageSummary = {
  messagesUsedToday: number;
  dailyLimit: number;
  messagesUsedThisMonth: number;
  monthlyLimit: number;
  planCode: PlanCode;
};

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: [{ monthlyPrice: "asc" }],
      where: { active: true },
    });

    return plans.map((plan) => this.serializePlan(plan));
  }

  async getBillingState(userId: string) {
    const [currentSubscription, usage] = await Promise.all([
      this.getOrCreateCurrentSubscription(userId),
      this.getAIUsage(userId),
    ]);

    return {
      currentPlan: this.serializePlan(currentSubscription.plan),
      subscription: this.serializeSubscription(currentSubscription),
      aiUsage: usage,
    };
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { code: dto.planCode },
    });

    if (!plan?.active) {
      throw new NotFoundException("Plan is not available.");
    }

    const currentSubscription = await this.getOrCreateCurrentSubscription(userId);

    if (
      currentSubscription.plan.code === plan.code &&
      currentSubscription.status === SubscriptionStatus.ACTIVE
    ) {
      throw new ConflictException("You are already on this plan.");
    }

    const amount = dto.interval === BillingInterval.MONTHLY ? plan.monthlyPrice : plan.yearlyPrice;

    if (amount <= 0) {
      throw new BadRequestException("Free plan does not require checkout.");
    }

    const period = this.createPeriod(dto.interval);
    const gateway = this.toPaymentGateway(dto.gateway);
    const pendingSubscription = await this.prisma.subscription.create({
      data: {
        currentPeriodEnd: period.end,
        currentPeriodStart: period.start,
        gateway,
        planId: plan.id,
        status: SubscriptionStatus.TRIALING,
        userId,
      },
    });

    const checkout = await this.paymentsService.createSubscriptionCheckoutSession({
      amount,
      currency: plan.currency,
      gateway,
      interval: dto.interval,
      planCode: plan.code,
      planId: plan.id,
      subscriptionId: pendingSubscription.id,
      userId,
    });

    return {
      checkout,
      subscription: this.serializeSubscription({
        ...pendingSubscription,
        plan,
      }),
    };
  }

  async cancel(userId: string) {
    const subscription = await this.findActivePaidSubscription(userId);

    if (!subscription) {
      throw new BadRequestException("No active paid subscription to cancel.");
    }

    const updatedSubscription = await this.prisma.subscription.update({
      data: {
        cancelledAt: new Date(),
        status: SubscriptionStatus.CANCELLED,
      },
      include: { plan: true },
      where: { id: subscription.id },
    });

    return this.serializeSubscription(updatedSubscription);
  }

  async getAIUsage(userId: string): Promise<AIUsageSummary> {
    const subscription = await this.getOrCreateCurrentSubscription(userId);
    const { today, month } = getUsageWindows();
    const [todayUsage, monthUsage] = await Promise.all([
      this.prisma.aIUsageEvent.aggregate({
        _sum: { messagesUsed: true },
        where: { date: today, userId },
      }),
      this.prisma.aIUsageEvent.aggregate({
        _sum: { messagesUsed: true },
        where: { month, userId },
      }),
    ]);

    return {
      dailyLimit: subscription.plan.aiDailyLimit,
      messagesUsedThisMonth: monthUsage._sum.messagesUsed ?? 0,
      messagesUsedToday: todayUsage._sum.messagesUsed ?? 0,
      monthlyLimit: subscription.plan.aiMonthlyLimit,
      planCode: subscription.plan.code,
    };
  }

  async assertAIUsageAvailable(userId: string) {
    const usage = await this.getAIUsage(userId);

    if (
      usage.messagesUsedToday >= usage.dailyLimit ||
      usage.messagesUsedThisMonth >= usage.monthlyLimit
    ) {
      throw new UpgradeRequiredException({
        dailyLimit: usage.dailyLimit,
        messagesUsedThisMonth: usage.messagesUsedThisMonth,
        messagesUsedToday: usage.messagesUsedToday,
        monthlyLimit: usage.monthlyLimit,
        planCode: usage.planCode,
      });
    }

    return usage;
  }

  async consumeAIUsage(args: {
    userId: string;
    provider: string;
    model: string;
    tokensUsed: number;
  }) {
    const { today, month } = getUsageWindows();

    await this.prisma.aIUsageEvent.create({
      data: {
        date: today,
        messagesUsed: 1,
        model: args.model,
        month,
        provider: args.provider,
        tokensUsed: args.tokensUsed,
        userId: args.userId,
      },
    });

    return this.getAIUsage(args.userId);
  }

  private async getOrCreateCurrentSubscription(userId: string) {
    const paidSubscription = await this.findActivePaidSubscription(userId);

    if (paidSubscription) {
      return paidSubscription;
    }

    const freePlan = await this.prisma.plan.findUnique({ where: { code: PlanCode.FREE } });

    if (!freePlan) {
      throw new NotFoundException("Free plan is not configured.");
    }

    const existingFreeSubscription = await this.prisma.subscription.findFirst({
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      where: {
        plan: { code: PlanCode.FREE },
        status: SubscriptionStatus.ACTIVE,
        userId,
      },
    });

    if (existingFreeSubscription) {
      return existingFreeSubscription;
    }

    return this.prisma.subscription.create({
      data: {
        currentPeriodEnd: new Date("2099-12-31T23:59:59.000Z"),
        currentPeriodStart: new Date(),
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        userId,
      },
      include: { plan: true },
    });
  }

  private async findActivePaidSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      include: { plan: true },
      orderBy: { currentPeriodEnd: "desc" },
      where: {
        currentPeriodEnd: { gt: new Date() },
        plan: { code: { not: PlanCode.FREE } },
        status: SubscriptionStatus.ACTIVE,
        userId,
      },
    });
  }

  private serializePlan(plan: Plan) {
    return {
      active: plan.active,
      aiDailyLimit: plan.aiDailyLimit,
      aiMonthlyLimit: plan.aiMonthlyLimit,
      code: plan.code,
      currency: plan.currency,
      description: plan.description,
      features: plan.features,
      id: plan.id,
      monthlyPrice: plan.monthlyPrice,
      name: plan.name,
      yearlyPrice: plan.yearlyPrice,
    };
  }

  private serializeSubscription(subscription: Subscription | SubscriptionWithPlan) {
    const plan = "plan" in subscription ? subscription.plan : undefined;
    return {
      cancelledAt: subscription.cancelledAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      gateway: subscription.gateway,
      gatewaySubscriptionId: subscription.gatewaySubscriptionId,
      id: subscription.id,
      plan: plan ? this.serializePlan(plan) : undefined,
      planId: subscription.planId,
      status: subscription.status,
    };
  }

  private createPeriod(interval: BillingInterval) {
    const start = new Date();
    const end = new Date(start);

    if (interval === BillingInterval.YEARLY) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }

    return { end, start };
  }

  private toPaymentGateway(gateway: BillingGateway) {
    return gateway === BillingGateway.STRIPE ? PaymentGateway.STRIPE : PaymentGateway.RAZORPAY;
  }
}

export class UpgradeRequiredException extends HttpException {
  constructor(usage: AIUsageSummary) {
    super(
      {
        error: "UPGRADE_REQUIRED",
        message: "AI usage limit reached. Upgrade your plan to continue.",
        usage,
      },
      402,
    );
  }
}

function getUsageWindows() {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  return { month, today };
}
