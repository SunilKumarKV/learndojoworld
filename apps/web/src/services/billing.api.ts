import { apiClient } from "@/services/api-client";

export type PlanCode = "FREE" | "PRO" | "PREMIUM";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "TRIALING";
export type BillingInterval = "MONTHLY" | "YEARLY";
export type BillingGateway = "stripe" | "razorpay";

export type BillingPlan = {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  aiDailyLimit: number;
  aiMonthlyLimit: number;
  features: unknown;
  active: boolean;
};

export type AIUsageSummary = {
  messagesUsedToday: number;
  dailyLimit: number;
  messagesUsedThisMonth: number;
  monthlyLimit: number;
  planCode: PlanCode;
};

export type BillingSubscription = {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  gateway: "STRIPE" | "RAZORPAY" | null;
  gatewaySubscriptionId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  plan?: BillingPlan;
};

export type BillingState = {
  currentPlan: BillingPlan;
  subscription: BillingSubscription;
  aiUsage: AIUsageSummary;
};

export type SubscriptionCheckout = {
  subscription: BillingSubscription;
  checkout: {
    gateway: BillingGateway;
    paymentId: string;
    gatewayOrderId: string;
    amount: number;
    currency: string;
    checkoutUrl: string | null;
    publishableKey?: string;
    keyId?: string;
    providerConfigured: boolean;
  };
};

export async function getBillingPlans() {
  return apiClient<BillingPlan[]>("/billing/plans");
}

export async function getMyBilling() {
  return apiClient<BillingState>("/billing/me");
}

export async function subscribeToPlan(payload: {
  planCode: Exclude<PlanCode, "FREE">;
  interval: BillingInterval;
  gateway: BillingGateway;
}) {
  return apiClient<SubscriptionCheckout>("/billing/subscribe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelSubscription() {
  return apiClient<BillingSubscription>("/billing/cancel", {
    method: "POST",
  });
}

export async function getAIUsage() {
  return apiClient<AIUsageSummary>("/ai/usage");
}
