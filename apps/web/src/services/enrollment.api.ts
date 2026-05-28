import { apiClient, type ApiResponse } from "@/services/api-client";

export type EnrollmentPayload = {
  courseId: string;
};

export type EnrollmentRecord = {
  id: string;
  progressPercent: number;
  createdAt: string;
  completedAt: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
    subtitle: string | null;
    thumbnailUrl: string | null;
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    isFree: boolean;
    price: number | null;
    currency: string;
  };
};

export type EnrollmentStatus = {
  enrolled: boolean;
  enrollmentId?: string;
  progressPercent: number;
  completedAt: string | null;
};

export async function enrollInCourse(courseId: string): Promise<ApiResponse<EnrollmentRecord>> {
  return apiClient<EnrollmentRecord>("/enrollments", {
    method: "POST",
    body: JSON.stringify({ courseId }),
  });
}

export async function getMyEnrollments(): Promise<ApiResponse<EnrollmentRecord[]>> {
  return apiClient<EnrollmentRecord[]>("/enrollments/me");
}

export async function getEnrollmentStatus(
  courseId: string,
): Promise<ApiResponse<EnrollmentStatus>> {
  return apiClient<EnrollmentStatus>(`/courses/${courseId}/enrollment-status`);
}
