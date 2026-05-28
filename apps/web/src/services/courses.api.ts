import { apiClient, type ApiResponse } from "@/services/api-client";

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: {
    courses: number;
  };
};

export type CourseListItem = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnailUrl: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  isFree: boolean;
  price: number | null;
  currency: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  moduleCount: number;
  enrollmentCount: number;
};

export type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnailUrl: string | null;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  language: string;
  isFree: boolean;
  price: number | null;
  currency: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  modules: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      slug: string;
      type: "VIDEO" | "ARTICLE" | "EXERCISE";
      order: number;
      content: string;
      videoUrl: string | null;
      durationSec: number | null;
      isPreview: boolean;
    }>;
  }>;
};

export async function getCategories(): Promise<ApiResponse<CategorySummary[]>> {
  return apiClient<CategorySummary[]>("/categories");
}

export async function getCourses(params?: {
  search?: string | undefined;
  difficulty?: string | undefined;
  category?: string | undefined;
}): Promise<ApiResponse<CourseListItem[]>> {
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.set("search", params.search);
  if (params?.difficulty) searchParams.set("difficulty", params.difficulty);
  if (params?.category) searchParams.set("category", params.category);

  return apiClient<CourseListItem[]>(
    `/courses${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
  );
}

export async function getCourseBySlug(slug: string): Promise<ApiResponse<CourseDetail>> {
  return apiClient<CourseDetail>(`/courses/${slug}`);
}
