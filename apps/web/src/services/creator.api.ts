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
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
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
  return apiClient<CreatorCourse[]>("/creators/courses");
}
