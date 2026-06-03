import { apiClient } from "@/services/api-client";

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
