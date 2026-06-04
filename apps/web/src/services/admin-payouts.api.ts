import { apiClient } from "@/services/api-client";
import type { PayoutMethod, PayoutRequestStatus } from "@/services/creator-revenue.api";

export type AdminPayoutRequest = {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: PayoutRequestStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    displayName: string | null;
    payoutProfile: {
      legalName: string;
      country: string;
      payoutMethod: PayoutMethod;
      bankName: string | null;
      accountLast4: string | null;
      upiId: string | null;
      paypalEmail: string | null;
    } | null;
    user: {
      id: string;
      email: string;
      username: string;
      name: string | null;
    };
  };
};

export async function getAdminPayoutRequests() {
  const response = await apiClient<AdminPayoutRequest[]>("/admin/payout-requests");
  return response.data;
}

export async function approveAdminPayoutRequest(id: string) {
  const response = await apiClient<AdminPayoutRequest>(`/admin/payout-requests/${id}/approve`, {
    method: "POST",
  });
  return response.data;
}

export async function rejectAdminPayoutRequest(id: string, notes: string) {
  const response = await apiClient<AdminPayoutRequest>(`/admin/payout-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
  return response.data;
}
