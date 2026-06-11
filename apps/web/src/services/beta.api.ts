import { apiClient } from "@/services/api-client";

export type BetaAccessStatus = "INVITED" | "ACCEPTED" | "REVOKED";
export type BetaWaitlistRoleInterest = "LEARNER" | "CREATOR" | "BOTH";
export type BetaWaitlistStatus = "WAITLISTED" | "INVITED" | "ACCEPTED" | "REJECTED";
export type FeedbackType = "BUG" | "FEATURE_REQUEST" | "CONFUSION" | "GENERAL_FEEDBACK";
export type FeedbackStatus = "OPEN" | "REVIEWED" | "CLOSED";
export type SupportRequestStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type ActivationChecklist = {
  completeOnboarding: boolean;
  enrollFirstCourse: boolean;
  completeFirstLesson: boolean;
  tryAITutor: boolean;
  submitFeedback: boolean;
};

export type BetaAccess = {
  id: string;
  email: string;
  userId: string | null;
  cohortId?: string | null;
  status: BetaAccessStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  cohort?: { id: string; name: string; targetUsers?: number } | null;
  user?: { id: string; email: string; name: string | null; username: string } | null;
};

export type BetaMe = {
  status: BetaAccessStatus | null;
  access: BetaAccess | null;
  activation: ActivationChecklist;
};

export type BetaWaitlistEntry = {
  id: string;
  email: string;
  name: string | null;
  roleInterest: BetaWaitlistRoleInterest;
  source: string | null;
  status: BetaWaitlistStatus;
  createdAt: string;
  updatedAt: string;
};

export type BetaCohort = {
  id: string;
  name: string;
  description: string | null;
  targetUsers: number;
  createdAt: string;
  updatedAt: string;
  _count?: { betaAccess: number };
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

export type First100Dashboard = {
  waitlist: {
    accepted: number;
    invited: number;
    rejected: number;
    total: number;
    waitlisted: number;
  };
  invites: {
    accepted: number;
    invited: number;
    revoked: number;
  };
  activation: {
    creatorApplications: number;
    feedbackSubmitted: number;
    firstAIMessage: number;
    firstCourseEnrollment: number;
    firstLessonCompleted: number;
    onboardingCompleted: number;
    signupCount: number;
    supportRequests: number;
  };
  rates: {
    creatorApplicationRate: number;
    firstAIMessageRate: number;
    firstCourseEnrollmentRate: number;
    firstLessonCompletionRate: number;
    onboardingCompletionRate: number;
    waitlistInviteRate: number;
  };
  cohorts: BetaCohort[];
  betaUserProgress: Array<{
    betaAccessId: string;
    cohort: { id: string; name: string } | null;
    email: string;
    feedbackSubmitted: number;
    firstAIMessage: boolean;
    firstCourseEnrollment: boolean;
    firstLessonCompleted: boolean;
    lastActivity: { createdAt: string; event: string } | null;
    name: string | null;
    onboardingCompleted: boolean;
    supportRequests: number;
    userId: string;
    username: string;
  }>;
};

export async function joinBetaWaitlist(payload: {
  email: string;
  name?: string;
  roleInterest: BetaWaitlistRoleInterest;
  source?: string;
}) {
  const response = await apiClient<{ id: string; status: BetaWaitlistStatus }>("/beta/waitlist", {
    body: JSON.stringify(payload),
    method: "POST",
  });
  return response.data;
}

export async function getMyBetaAccess() {
  const response = await apiClient<BetaMe>("/beta/me");
  return response.data;
}

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
  getFirst100Dashboard: async () => {
    const response = await apiClient<First100Dashboard>("/admin/beta/first-100");
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
  listWaitlist: async () => {
    const response = await apiClient<BetaWaitlistEntry[]>("/admin/beta/waitlist");
    return response.data;
  },
  inviteWaitlist: async (id: string) => {
    const response = await apiClient<{ access: BetaAccess; waitlist: BetaWaitlistEntry }>(
      `/admin/beta/waitlist/${id}/invite`,
      { method: "POST" },
    );
    return response.data;
  },
  rejectWaitlist: async (id: string) => {
    const response = await apiClient<BetaWaitlistEntry>(`/admin/beta/waitlist/${id}/reject`, {
      method: "POST",
    });
    return response.data;
  },
  listCohorts: async () => {
    const response = await apiClient<BetaCohort[]>("/admin/beta/cohorts");
    return response.data;
  },
  createCohort: async (payload: { name: string; description?: string; targetUsers: number }) => {
    const response = await apiClient<BetaCohort>("/admin/beta/cohorts", {
      body: JSON.stringify(payload),
      method: "POST",
    });
    return response.data;
  },
  updateAccess: async (
    id: string,
    payload: { status?: BetaAccessStatus; notes?: string; userId?: string; cohortId?: string },
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
