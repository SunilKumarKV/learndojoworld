import { apiClient } from "./api-client";

export interface ReferralMeResponse {
  referralCode: string;
  referralLink: string;
  totalInvites: number;
  successfulReferrals: number;
  pendingReferrals: number;
  pendingRewards: number;
  grantedRewards: number;
  activeBenefit: {
    planCode: "PRO" | "PREMIUM";
    currentPeriodEnd: string;
    source: "REFERRAL_OR_PAID_PRO" | "PREMIUM";
  } | null;
}

export interface ReferralEvent {
  id: string;
  invitedUser: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
}

export interface ReferralRewardItem {
  id: string;
  rewardType: string;
  rewardValue: string;
  status: "PENDING" | "APPROVED" | "GRANTED" | "REJECTED";
  createdAt: string;
  fulfilledAt: string | null;
  fulfillmentReference: string | null;
  notes: string | null;
  relatedUser: string;
  role: "Inviter" | "Invitee";
}

export interface ReferralStatsResponse {
  metrics: {
    totalGrantedRewards: number;
  };
  recentEvents: ReferralEvent[];
  myRewards: ReferralRewardItem[];
}

export const referralsApi = {
  getMe: async (): Promise<ReferralMeResponse> => {
    const response = await apiClient<ReferralMeResponse>("/api/v1/referrals/me");
    return response.data;
  },
  getStats: async (): Promise<ReferralStatsResponse> => {
    const response = await apiClient<ReferralStatsResponse>("/api/v1/referrals/stats");
    return response.data;
  },
  applyCode: async (
    code: string,
  ): Promise<{ message: string; eventId: string; status: string }> => {
    const response = await apiClient<{ message: string; eventId: string; status: string }>(
      "/api/v1/referrals/apply",
      {
        method: "POST",
        body: JSON.stringify({ code }),
      },
    );
    return response.data;
  },
};
