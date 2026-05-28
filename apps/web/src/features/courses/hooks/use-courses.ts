"use client";

import { useQuery } from "@tanstack/react-query";

import { getCategories, getCourses } from "@/services/courses.api";

export function useCategories() {
  return useQuery({
    queryFn: async () => {
      const response = await getCategories();
      if (!response.success) throw new Error(response.message || "Unable to load categories.");
      return response.data;
    },
    queryKey: ["categories"],
  });
}

export function useCourses(params?: {
  search?: string | undefined;
  difficulty?: string | undefined;
  category?: string | undefined;
}) {
  return useQuery({
    queryFn: async () => {
      const response = await getCourses(params);
      if (!response.success) throw new Error(response.message || "Unable to load courses.");
      return response.data;
    },
    queryKey: ["courses", params?.search ?? "", params?.difficulty ?? "", params?.category ?? ""],
  });
}
