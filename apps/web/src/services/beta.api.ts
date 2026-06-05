import { apiClient } from "@/services/api-client";

export type BetaAccessStatus = "INVITED" | "ACCEPTED" | "REVOKED";
export type FeedbackType = "BUG" | "FEATURE_REQUEST" | "CONFUSION" | "GENERAL_FEEDBACK";
export type FeedbackStatus = "OPEN" | "REVIEWED" | "CLOSED";
export type SupportRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type BetaAccess = {
  id: string;
  email: string;
  userId: string | null;
  status: BetaAccessStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  user?: { id: string; email: string; name: string | null; username: string } | null;
};

export type Feedback = {
  id: string;
  type: FeedbackType;
  message: string;
  path: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  user?: { id: string; email: string; name: string | null; username: string };
};

export type SupportRequest = {
  id: string;
  subject: string;
  message: string;
  path: string | null;
  status: SupportRequestStatus;
  adminNote: string | null;
  createdAt: string;
  user?: { id: string; email: string; name: string | null; username: string };
};

export type BetaDashboard = {
  beta: {
    activeBetaUsers: number;
    totalBetaUsers: number;
  };
  feedback: {
    open: number;
    total: number;
  };
  support: {
    open: number;
    total: number;
  };
  product: {
    aiMessagesToday: number;
    aiTokensToday: number;
    creatorApplications: number;
    enrollments: number;
  };
  funnel: {
    creatorApplicationRate: number;
    firstAIUsageRate: number;
    firstCourseEnrollmentRate: number;
    firstLessonCompletionRate: number;
    onboardingCompletionRate: number;
    signupConversion: {
      acceptedBetaUsers: number;
      totalSignups: number;
    };
  };
  goals: {
    aiSessionsPerDay: number;
    betaUsers: number;
    creators: number;
    lessonsCompleted: number;
    publishedCourses: number;
  };
};

export async function submitFeedback(payload: {
  type: FeedbackType;
  message: string;
  path?: string;
}) {
  const response = await apiClient<Feedback>("/beta/feedback", {
    body: JSON.stringify(payload),
    method: "POST",
  });
  return response.data;
}

export async function submitSupportRequest(payload: {
  subject: string;
  message: string;
  path?: string;
}) {
  const response = await apiClient<SupportRequest>("/beta/support", {
    body: JSON.stringify(payload),
    method: "POST",
  });
  return response.data;
}

export const adminBetaApi = {
  getDashboard: async () => {
    const response = await apiClient<BetaDashboard>("/admin/beta/dashboard");
    return response.data;
  },
  listAccess: async () => {
    const response = await apiClient<BetaAccess[]>("/admin/beta/access");
    return response.data;
  },
  createAccess: async (payload: { email: string; notes?: string }) => {
    const response = await apiClient<BetaAccess>("/admin/beta/access", {
      body: JSON.stringify(payload),
      method: "POST",
    });
    return response.data;
  },
  updateAccess: async (
    id: string,
    payload: { status?: BetaAccessStatus; notes?: string; userId?: string },
  ) => {
    const response = await apiClient<BetaAccess>(`/admin/beta/access/${id}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });
    return response.data;
  },
  listFeedback: async () => {
    const response = await apiClient<Feedback[]>("/admin/beta/feedback");
    return response.data;
  },
  updateFeedback: async (id: string, payload: { status?: FeedbackStatus; adminNote?: string }) => {
    const response = await apiClient<Feedback>(`/admin/beta/feedback/${id}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });
    return response.data;
  },
  listSupport: async () => {
    const response = await apiClient<SupportRequest[]>("/admin/beta/support");
    return response.data;
  },
  updateSupport: async (
    id: string,
    payload: { status?: SupportRequestStatus; adminNote?: string },
  ) => {
    const response = await apiClient<SupportRequest>(`/admin/beta/support/${id}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });
    return response.data;
  },
};
