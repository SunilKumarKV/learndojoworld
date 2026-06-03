import { apiClient, type ApiResponse } from "@/services/api-client";

export type LessonDetail = {
  id: string;
  title: string;
  slug: string;
  type: "VIDEO" | "ARTICLE" | "EXERCISE";
  content: string;
  videoUrl: string | null;
  durationSec: number | null;
  isPreview: boolean;
  module: {
    id: string;
    title: string;
    order: number;
  };
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
  };
};

export async function getLessonById(lessonId: string): Promise<ApiResponse<LessonDetail>> {
  return apiClient<LessonDetail>(`/lessons/${lessonId}`);
}
