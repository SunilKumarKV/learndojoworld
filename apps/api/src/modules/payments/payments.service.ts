import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import {
  PaymentGateway,
  PaymentStatus,
  PlanCode,
  Prisma,
  SubscriptionStatus,
} from "@prisma/client";

import type { EnvironmentVariables } from "../../config/env.validation";
import { PrismaService } from "../../lib/prisma/prisma.service";
import {
  CheckoutRequestDto,
  PaymentGateway as CheckoutPaymentGateway,
} from "./dto/checkout-request.dto";

export type CheckoutResponse = {
  gateway: "stripe" | "razorpay";
  paymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  publishableKey?: string;
  keyId?: string;
  providerConfigured: boolean;
};

type SubscriptionCheckoutArgs = {
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  interval: "MONTHLY" | "YEARLY";
  planCode: PlanCode;
  planId: string;
  subscriptionId: string;
  userId: string;
};

type PaymentMetadata = {
  checkoutType?: "COURSE" | "SUBSCRIPTION";
  courseSlug?: string;
  internalOrderId?: string;
  interval?: "MONTHLY" | "YEARLY";
  planCode?: PlanCode;
  planId?: string;
  subscriptionId?: string;
};

type StripeWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      metadata?: {
        paymentId?: string;
        ldwPaymentId?: string;
      };
      payment_intent?: string;
      client_reference_id?: string;
    };
  };
};

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        notes?: {
          paymentId?: string;
          ldwPaymentId?: string;
        };
      };
    };
    order?: {
      entity?: {
        id?: string;
        notes?: {
          paymentId?: string;
          ldwPaymentId?: string;
        };
      };
    };
  };
};

type WebhookPaymentLookup = {
  gateway: PaymentGateway;
  gatewayOrderId: string | undefined;
  gatewayPaymentId: string | undefined;
  paymentId: string | undefined;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly prisma: PrismaService,
  ) {}

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      where: { userId },
    });
  }

  async createCheckoutSession(userId: string, dto: CheckoutRequestDto): Promise<CheckoutResponse> {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new BadRequestException("Course not found.");
    }

    if (course.status !== "PUBLISHED") {
      throw new BadRequestException("Course is not available for purchase.");
    }

    if (course.isFree) {
      throw new BadRequestException("This course is free. Use enrollment instead.");
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          courseId: dto.courseId,
          userId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException("You are already enrolled in this course.");
    }

    const existingPendingPayment = await this.prisma.payment.findFirst({
      orderBy: { createdAt: "desc" },
      where: {
        courseId: dto.courseId,
        status: PaymentStatus.PENDING,
        userId,
      },
    });

    if (existingPendingPayment) {
      return this.buildCheckoutResponse(existingPendingPayment);
    }

    const amount = this.resolveAmountInMinorUnits(course.price);

    if (amount <= 0) {
      throw new BadRequestException("Course price is not valid.");
    }

    const payment = await this.prisma.payment.create({
      data: {
        amount,
        courseId: dto.courseId,
        currency: course.currency || "USD",
        gateway:
          dto.gateway === CheckoutPaymentGateway.STRIPE
            ? PaymentGateway.STRIPE
            : PaymentGateway.RAZORPAY,
        metadata: {
          checkoutType: "COURSE",
          courseSlug: course.slug,
        },
        status: PaymentStatus.PENDING,
        userId,
      },
    });

    const gatewayOrderId = this.createInternalGatewayOrderId(payment.gateway, payment.id);
    const updatedPayment = await this.prisma.payment.update({
      data: {
        gatewayOrderId,
        metadata: {
          checkoutType: "COURSE",
          courseSlug: course.slug,
          internalOrderId: gatewayOrderId,
        },
      },
      where: { id: payment.id },
    });

    return this.buildCheckoutResponse(updatedPayment);
  }

  async createSubscriptionCheckoutSession(
    args: SubscriptionCheckoutArgs,
  ): Promise<CheckoutResponse> {
    const payment = await this.prisma.payment.create({
      data: {
        amount: args.amount,
        currency: args.currency,
        gateway: args.gateway,
        metadata: {
          checkoutType: "SUBSCRIPTION",
          interval: args.interval,
          planCode: args.planCode,
          planId: args.planId,
          subscriptionId: args.subscriptionId,
        },
        status: PaymentStatus.PENDING,
        subscriptionId: args.subscriptionId,
        userId: args.userId,
      },
    });

    const gatewayOrderId = this.createInternalGatewayOrderId(payment.gateway, payment.id);
    const updatedPayment = await this.prisma.payment.update({
      data: {
        gatewayOrderId,
        metadata: {
          checkoutType: "SUBSCRIPTION",
          internalOrderId: gatewayOrderId,
          interval: args.interval,
          planCode: args.planCode,
          planId: args.planId,
          subscriptionId: args.subscriptionId,
        },
      },
      where: { id: payment.id },
    });

    return this.buildCheckoutResponse(updatedPayment);
  }

  async handleStripeWebhook(signature: string | undefined, rawBody: string) {
    this.verifyStripeSignature(signature, rawBody);

    const event = this.parseJson<StripeWebhookEvent>(rawBody);
    const object = event.data?.object;
    const paymentId = object?.metadata?.ldwPaymentId ?? object?.metadata?.paymentId;
    const gatewayPaymentId = object?.payment_intent ?? object?.id;
    const gatewayOrderId = object?.client_reference_id;

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      await this.markPaymentSuccess({
        gateway: PaymentGateway.STRIPE,
        gatewayOrderId,
        gatewayPaymentId,
        paymentId,
      });
    }

    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "checkout.session.expired"
    ) {
      await this.markPaymentFailed({
        gateway: PaymentGateway.STRIPE,
        gatewayOrderId,
        gatewayPaymentId,
        paymentId,
      });
    }

    return { received: true };
  }

  async handleRazorpayWebhook(signature: string | undefined, rawBody: string) {
    this.verifyRazorpaySignature(signature, rawBody);

    const event = this.parseJson<RazorpayWebhookEvent>(rawBody);
    const payment = event.payload?.payment?.entity;
    const order = event.payload?.order?.entity;
    const paymentId =
      payment?.notes?.ldwPaymentId ?? payment?.notes?.paymentId ?? order?.notes?.ldwPaymentId;
    const gatewayPaymentId = payment?.id;
    const gatewayOrderId = payment?.order_id ?? order?.id;

    if (event.event === "payment.captured" || event.event === "payment.authorized") {
      await this.markPaymentSuccess({
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId,
        gatewayPaymentId,
        paymentId,
      });
    }

    if (event.event === "payment.failed") {
      await this.markPaymentFailed({
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId,
        gatewayPaymentId,
        paymentId,
      });
    }

    return { received: true };
  }

  private async buildCheckoutResponse(payment: {
    id: string;
    amount: number;
    currency: string;
    gateway: PaymentGateway;
    gatewayOrderId: string | null;
  }): Promise<CheckoutResponse> {
    if (payment.gateway === PaymentGateway.STRIPE) {
      return this.buildStripeCheckoutResponse(payment);
    }

    return this.buildRazorpayCheckoutResponse(payment);
  }

  private async buildStripeCheckoutResponse(payment: {
    id: string;
    amount: number;
    currency: string;
    gatewayOrderId: string | null;
  }): Promise<CheckoutResponse> {
    const secretKey = this.configService.get("STRIPE_SECRET_KEY", { infer: true });
    const gatewayOrderId =
      payment.gatewayOrderId ??
      this.createInternalGatewayOrderId(PaymentGateway.STRIPE, payment.id);

    if (!secretKey) {
      return {
        amount: payment.amount,
        checkoutUrl: null,
        currency: payment.currency,
        gateway: "stripe",
        gatewayOrderId,
        paymentId: payment.id,
        providerConfigured: false,
      };
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      body: new URLSearchParams({
        "line_items[0][price_data][currency]": payment.currency.toLowerCase(),
        "line_items[0][price_data][product_data][name]": "LearnDojoWorld course",
        "line_items[0][price_data][unit_amount]": String(payment.amount),
        "line_items[0][quantity]": "1",
        mode: "payment",
        client_reference_id: gatewayOrderId,
        "metadata[ldwPaymentId]": payment.id,
        success_url: `${this.configService.get("WEB_ORIGIN", { infer: true })}/billing?status=pending`,
        cancel_url: `${this.configService.get("WEB_ORIGIN", { infer: true })}/billing?status=cancelled`,
      }),
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new BadRequestException("Unable to create Stripe checkout session.");
    }

    const session = (await response.json()) as { id?: string; url?: string };

    return {
      amount: payment.amount,
      checkoutUrl: session.url ?? null,
      currency: payment.currency,
      gateway: "stripe",
      gatewayOrderId,
      paymentId: payment.id,
      providerConfigured: true,
    };
  }

  private async buildRazorpayCheckoutResponse(payment: {
    id: string;
    amount: number;
    currency: string;
    gatewayOrderId: string | null;
  }): Promise<CheckoutResponse> {
    const keyId = this.configService.get("RAZORPAY_KEY_ID", { infer: true });
    const keySecret = this.configService.get("RAZORPAY_KEY_SECRET", { infer: true });
    const gatewayOrderId =
      payment.gatewayOrderId ??
      this.createInternalGatewayOrderId(PaymentGateway.RAZORPAY, payment.id);

    if (!keyId || !keySecret) {
      return {
        amount: payment.amount,
        checkoutUrl: null,
        currency: payment.currency,
        gateway: "razorpay",
        gatewayOrderId,
        keyId: this.configService.get("NEXT_PUBLIC_RAZORPAY_KEY_ID", { infer: true }) ?? "",
        paymentId: payment.id,
        providerConfigured: false,
      };
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      body: JSON.stringify({
        amount: payment.amount,
        currency: payment.currency,
        notes: {
          ldwPaymentId: payment.id,
        },
        receipt: gatewayOrderId,
      }),
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new BadRequestException("Unable to create Razorpay order.");
    }

    const order = (await response.json()) as { id?: string };

    if (order.id && order.id !== payment.gatewayOrderId) {
      await this.prisma.payment.update({
        data: { gatewayOrderId: order.id },
        where: { id: payment.id },
      });
    }

    return {
      amount: payment.amount,
      checkoutUrl: null,
      currency: payment.currency,
      gateway: "razorpay",
      gatewayOrderId: order.id ?? gatewayOrderId,
      keyId,
      paymentId: payment.id,
      providerConfigured: true,
    };
  }

  private verifyStripeSignature(signature: string | undefined, rawBody: string) {
    const secret = this.resolveWebhookSecret("STRIPE_WEBHOOK_SECRET");

    if (!signature) {
      throw new UnauthorizedException("Missing Stripe webhook signature.");
    }

    const timestamp = signature
      .split(",")
      .map((part) => part.split("="))
      .find(([key]) => key === "t")?.[1];
    const expectedSignature = signature
      .split(",")
      .map((part) => part.split("="))
      .find(([key]) => key === "v1")?.[1];

    if (!timestamp || !expectedSignature) {
      throw new UnauthorizedException("Invalid Stripe webhook signature.");
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const computed = createHmac("sha256", secret).update(signedPayload).digest("hex");

    if (!safeCompare(computed, expectedSignature)) {
      throw new UnauthorizedException("Invalid Stripe webhook signature.");
    }
  }

  private verifyRazorpaySignature(signature: string | undefined, rawBody: string) {
    const secret = this.resolveWebhookSecret("RAZORPAY_WEBHOOK_SECRET");

    if (!signature) {
      throw new UnauthorizedException("Missing Razorpay webhook signature.");
    }

    const computed = createHmac("sha256", secret).update(rawBody).digest("hex");

    if (!safeCompare(computed, signature)) {
      throw new UnauthorizedException("Invalid Razorpay webhook signature.");
    }
  }

  private resolveWebhookSecret(key: "STRIPE_WEBHOOK_SECRET" | "RAZORPAY_WEBHOOK_SECRET") {
    const configuredSecret = this.configService.get(key, { infer: true });

    if (configuredSecret) {
      return configuredSecret;
    }

    if (this.configService.get("NODE_ENV", { infer: true }) !== "production") {
      return this.configService.get("JWT_SECRET", { infer: true });
    }

    throw new UnauthorizedException(`${key} is not configured.`);
  }

  private async markPaymentSuccess(args: WebhookPaymentLookup) {
    const payment = await this.findWebhookPayment(args);

    if (!payment || payment.status === PaymentStatus.SUCCESS) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        data: {
          gatewayPaymentId: args.gatewayPaymentId ?? payment.gatewayPaymentId,
          status: PaymentStatus.SUCCESS,
        },
        where: { id: payment.id },
      });

      if (payment.courseId) {
        await tx.enrollment.upsert({
          create: {
            courseId: payment.courseId,
            progressPercent: 0,
            userId: payment.userId,
          },
          update: {},
          where: {
            userId_courseId: {
              courseId: payment.courseId,
              userId: payment.userId,
            },
          },
        });
      }

      const metadata = this.readPaymentMetadata(payment.metadata);
      const subscriptionId = payment.subscriptionId ?? metadata.subscriptionId;

      if (metadata.checkoutType === "SUBSCRIPTION" && subscriptionId) {
        const activatedSubscription = await tx.subscription.update({
          data: {
            status: SubscriptionStatus.ACTIVE,
          },
          where: { id: subscriptionId },
        });

        await tx.subscription.updateMany({
          data: {
            cancelledAt: new Date(),
            status: SubscriptionStatus.EXPIRED,
          },
          where: {
            id: { not: activatedSubscription.id },
            status: SubscriptionStatus.ACTIVE,
            userId: payment.userId,
          },
        });
      }
    });
  }

  private async markPaymentFailed(args: WebhookPaymentLookup) {
    const payment = await this.findWebhookPayment(args);

    if (!payment || payment.status === PaymentStatus.SUCCESS) {
      return;
    }

    await this.prisma.payment.update({
      data: {
        gatewayPaymentId: args.gatewayPaymentId ?? payment.gatewayPaymentId,
        status: PaymentStatus.FAILED,
      },
      where: { id: payment.id },
    });
  }

  private async findWebhookPayment(args: WebhookPaymentLookup) {
    if (args.paymentId) {
      const payment = await this.prisma.payment.findUnique({ where: { id: args.paymentId } });
      if (payment?.gateway === args.gateway) return payment;
    }

    if (args.gatewayPaymentId) {
      const payment = await this.prisma.payment.findUnique({
        where: { gatewayPaymentId: args.gatewayPaymentId },
      });
      if (payment?.gateway === args.gateway) return payment;
    }

    if (args.gatewayOrderId) {
      return this.prisma.payment.findFirst({
        where: {
          gateway: args.gateway,
          gatewayOrderId: args.gatewayOrderId,
        },
      });
    }

    return null;
  }

  private createInternalGatewayOrderId(gateway: PaymentGateway, paymentId: string) {
    return `${gateway.toLowerCase()}_${paymentId.replace(/-/g, "")}`;
  }

  private resolveAmountInMinorUnits(price: unknown) {
    return Math.round(Number(price ?? 0) * 100);
  }

  private parseJson<T>(rawBody: string): T {
    try {
      return JSON.parse(rawBody) as T;
    } catch {
      throw new BadRequestException("Webhook payload is not valid JSON.");
    }
  }

  private readPaymentMetadata(metadata: Prisma.JsonValue | null): PaymentMetadata {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return {};
    }

    const parsed: PaymentMetadata = {};

    if (metadata.checkoutType === "SUBSCRIPTION" || metadata.checkoutType === "COURSE") {
      parsed.checkoutType = metadata.checkoutType;
    }

    if (metadata.interval === "MONTHLY" || metadata.interval === "YEARLY") {
      parsed.interval = metadata.interval;
    }

    if (
      metadata.planCode === PlanCode.FREE ||
      metadata.planCode === PlanCode.PRO ||
      metadata.planCode === PlanCode.PREMIUM
    ) {
      parsed.planCode = metadata.planCode;
    }

    if (typeof metadata.planId === "string") {
      parsed.planId = metadata.planId;
    }

    if (typeof metadata.subscriptionId === "string") {
      parsed.subscriptionId = metadata.subscriptionId;
    }

    return parsed;
  }
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
