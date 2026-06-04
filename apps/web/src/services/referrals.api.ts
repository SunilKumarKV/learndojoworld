import { apiClient } from "./api-client";

export interface ReferralMeResponse {
  referralCode: string;
  referralLink: string;
  totalInvites: number;
  successfulReferrals: number;
  pendingReferrals: number;
  pendingRewards: number;
  grantedRewards: number;
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
