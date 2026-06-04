import { apiClient } from "@/services/api-client";

export type MoneyAmount = {
  amount: number;
  currency: string;
};

export type CreatorEarning = {
  id: string;
  grossAmount: number;
  platformFee: number;
  creatorAmount: number;
  currency: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
};

export type CreatorTopCourse = {
  course: {
    id: string;
    title: string;
  };
  grossAmount: number;
  platformFee: number;
  creatorAmount: number;
  currency: string;
  salesCount: number;
};

export type CreatorRevenueSummary = {
  totalRevenue: MoneyAmount;
  pendingRevenue: MoneyAmount;
  paidRevenue: MoneyAmount;
  totalEnrollments: number;
  topCourses: CreatorTopCourse[];
  recentEarnings: CreatorEarning[];
};

export type PayoutMethod = "BANK" | "UPI" | "PAYPAL";
export type PayoutRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type PayoutProfile = {
  id: string;
  creatorId: string;
  legalName: string;
  country: string;
  payoutMethod: PayoutMethod;
  bankName: string | null;
  accountLast4: string | null;
  upiId: string | null;
  paypalEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PayoutRequest = {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: PayoutRequestStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertPayoutProfileInput = {
  legalName: string;
  country: string;
  payoutMethod: PayoutMethod;
  bankName?: string;
  accountLast4?: string;
  upiId?: string;
  paypalEmail?: string;
};

export async function getCreatorRevenue() {
  const response = await apiClient<CreatorRevenueSummary>("/creator/revenue");
  return response.data;
}

export async function getPayoutProfile() {
  const response = await apiClient<PayoutProfile | null>("/creator/payout-profile");
  return response.data;
}

export async function updatePayoutProfile(payload: UpsertPayoutProfileInput) {
  const response = await apiClient<PayoutProfile>("/creator/payout-profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function createPayoutRequest(payload: { amount: number; currency: string }) {
  const response = await apiClient<PayoutRequest>("/creator/payout-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getPayoutRequests() {
  const response = await apiClient<PayoutRequest[]>("/creator/payout-requests");
  return response.data;
}
