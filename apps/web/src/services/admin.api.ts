import { apiClient } from "@/services/api-client";

export interface AdminReferralData {
  events: Array<{
    id: string;
    status: string;
    createdAt: string;
    inviter: { name: string; email: string };
    invited: { name: string; email: string };
    referralCode: { code: string };
  }>;
  rewards: Array<{
    id: string;
    rewardType: string;
    rewardValue: string;
    status: "PENDING" | "APPROVED" | "GRANTED" | "REJECTED";
    notes: string | null;
    fulfilledAt: string | null;
    fulfillmentReference: string | null;
    createdAt: string;
    user: { name: string; email: string };
    referralEvent: {
      inviter: { name: string };
      invited: { name: string };
    };
  }>;
}

export type AdminDashboardData = {
  pendingCourses: number;
  publishedCourses: number;
  rejectedCourses: number;
  totalUsers: number;
};

export type AdminPendingCourse = {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  category: { id: string; name: string; slug: string } | null;
  creator: { id: string; name: string | null; username: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCourseReview = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnailUrl: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  isFree: boolean;
  category: { id: string; name: string; slug: string } | null;
  creator: { id: string; name: string | null; username: string; email: string } | null;
  modules: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      order: number;
      type: string;
      isPreview: boolean;
    }>;
  }>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  auditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    metadata: Record<string, unknown> | null;
    actor: { id: string; name: string | null; username: string; email: string } | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function getAdminDashboard() {
  const response = await apiClient<AdminDashboardData>("/admin/dashboard");
  return response.data;
}

export async function getAdminPendingCourses() {
  const response = await apiClient<AdminPendingCourse[]>("/admin/courses/pending");
  return response.data;
}

export async function getAdminCourseReview(id: string) {
  const response = await apiClient<AdminCourseReview>(`/admin/courses/${id}`);
  return response.data;
}

export async function approveCourse(id: string) {
  const response = await apiClient<null>(`/admin/courses/${id}/approve`, {
    method: "POST",
  });
  return response.data;
}

export async function rejectCourse(id: string, reason: string) {
  const response = await apiClient<null>(`/admin/courses/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return response.data;
}

export const adminApi = {
  getReferrals: async () => {
    const response = await apiClient<AdminReferralData>("/admin/referrals");
    return response.data;
  },
  approveReferralReward: async (id: string) => {
    const response = await apiClient<null>(`/admin/referrals/rewards/${id}/approve`, {
      method: "POST",
    });
    return response.data;
  },
  rejectReferralReward: async (id: string, reason: string) => {
    const response = await apiClient<null>(`/admin/referrals/rewards/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return response.data;
  },
  grantReferralReward: async (id: string) => {
    const response = await apiClient<null>(`/admin/referrals/rewards/${id}/grant`, {
      method: "POST",
    });
    return response.data;
  },
};
