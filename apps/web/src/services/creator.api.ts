import { apiClient, type ApiResponse } from "@/services/api-client";
import type { AuthUser } from "@/services/auth.api";

export type CreatorProfilePayload = {
  displayName: string;
  bio: string;
  expertise: string[];
  websiteUrl?: string | undefined;
  linkedinUrl?: string | undefined;
  youtubeUrl?: string | undefined;
};

export type CreatorProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  expertise: string[];
  websiteUrl: string | null;
  linkedinUrl: string | null;
  youtubeUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatorApplyResponse = {
  profile: CreatorProfile;
  user: AuthUser;
};

export type CreatorDashboard = {
  metrics: {
    coursesCount: number;
    learnersCount: number;
    rating: number | null;
    revenue: {
      amount: number;
      currency: "INR";
    };
  };
  nextAction: {
    href: string | null;
    label: string;
  };
};

export type CreatorCourse = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  status: CourseStatus;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  thumbnailUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  enrollmentCount: number;
  moduleCount: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type CourseStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export type CreatorLessonType = "TEXT" | "VIDEO" | "ARTICLE" | "EXERCISE";

export type CreatorLesson = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: CreatorLessonType;
  order: number;
  content: string;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatorModule = {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: CreatorLesson[];
  createdAt: string;
  updatedAt: string;
};

export type CreatorCourseDetail = {
  id: string;
  creatorId: string;
  categoryId: string | null;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnailUrl: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  status: CourseStatus;
  isFree: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  modules: CreatorModule[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type CreatorCoursePayload = {
  title: string;
  subtitle?: string | undefined;
  description: string;
  categoryId: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  thumbnailUrl?: string | undefined;
};

export type CreatorModulePayload = {
  title: string;
  order?: number | undefined;
};

export type CreatorLessonPayload = {
  title: string;
  type?: CreatorLessonType | undefined;
  content: string;
  order?: number | undefined;
};

export async function applyForCreator(
  payload: CreatorProfilePayload,
): Promise<ApiResponse<CreatorApplyResponse>> {
  return apiClient<CreatorApplyResponse>("/creators/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCreatorProfile(): Promise<ApiResponse<CreatorProfile>> {
  return apiClient<CreatorProfile>("/creators/me");
}

export async function updateCreatorProfile(
  payload: CreatorProfilePayload,
): Promise<ApiResponse<CreatorProfile>> {
  return apiClient<CreatorProfile>("/creators/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getCreatorDashboard(): Promise<ApiResponse<CreatorDashboard>> {
  return apiClient<CreatorDashboard>("/creators/dashboard");
}

export async function getCreatorCourses(): Promise<ApiResponse<CreatorCourse[]>> {
  return apiClient<CreatorCourse[]>("/creator/courses");
}

export async function createCreatorCourse(
  payload: CreatorCoursePayload,
): Promise<ApiResponse<CreatorCourseDetail>> {
  return apiClient<CreatorCourseDetail>("/creator/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCreatorCourse(id: string): Promise<ApiResponse<CreatorCourseDetail>> {
  return apiClient<CreatorCourseDetail>(`/creator/courses/${id}`);
}

export async function updateCreatorCourse(
  id: string,
  payload: Partial<CreatorCoursePayload>,
): Promise<ApiResponse<CreatorCourseDetail>> {
  return apiClient<CreatorCourseDetail>(`/creator/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCreatorCourse(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient<{ deleted: boolean }>(`/creator/courses/${id}`, {
    method: "DELETE",
  });
}

export async function createCreatorModule(
  courseId: string,
  payload: CreatorModulePayload,
): Promise<ApiResponse<CreatorModule>> {
  return apiClient<CreatorModule>(`/creator/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCreatorModule(
  moduleId: string,
  payload: CreatorModulePayload,
): Promise<ApiResponse<CreatorModule>> {
  return apiClient<CreatorModule>(`/creator/modules/${moduleId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCreatorModule(
  moduleId: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient<{ deleted: boolean }>(`/creator/modules/${moduleId}`, {
    method: "DELETE",
  });
}

export async function createCreatorLesson(
  moduleId: string,
  payload: CreatorLessonPayload,
): Promise<ApiResponse<CreatorLesson>> {
  return apiClient<CreatorLesson>(`/creator/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCreatorLesson(
  lessonId: string,
  payload: Partial<CreatorLessonPayload>,
): Promise<ApiResponse<CreatorLesson>> {
  return apiClient<CreatorLesson>(`/creator/lessons/${lessonId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteCreatorLesson(
  lessonId: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient<{ deleted: boolean }>(`/creator/lessons/${lessonId}`, {
    method: "DELETE",
  });
}

export async function submitCreatorCourseForReview(
  courseId: string,
): Promise<ApiResponse<CreatorCourseDetail>> {
  return apiClient<CreatorCourseDetail>(`/creator/courses/${courseId}/submit-review`, {
    method: "POST",
  });
}
