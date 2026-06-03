import { apiClient } from "@/services/api-client";

export type Payment = {
  id: string;
  courseId: string | null;
  gateway: "STRIPE" | "RAZORPAY";
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CANCELLED";
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
};

export type CheckoutSession = {
  gateway: "stripe" | "razorpay";
  paymentId: string;
  gatewayOrderId: string;
  keyId?: string;
  publishableKey?: string;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  providerConfigured: boolean;
};

export async function getMyPayments() {
  const response = await apiClient<Payment[]>("/payments/me");
  return response.data;
}

export async function createCheckoutSession(courseId: string, gateway: "stripe" | "razorpay") {
  const response = await apiClient<CheckoutSession>("/payments/checkout", {
    method: "POST",
    body: JSON.stringify({
      type: "COURSE",
      courseId,
      gateway,
    }),
  });
  return response.data;
}
