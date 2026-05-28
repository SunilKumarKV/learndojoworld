"use client";

import { useQuery } from "@tanstack/react-query";

import { getCourseBySlug } from "@/services/courses.api";

export function useCourseDetail(slug: string) {
  return useQuery({
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await getCourseBySlug(slug);
      if (!response.success) throw new Error(response.message || "Unable to load the course.");
      return response.data;
    },
    queryKey: ["course-detail", slug],
  });
}
