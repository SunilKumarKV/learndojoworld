"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { enrollInCourse, getMyEnrollments } from "@/services/enrollment.api";

export function useMyLearning() {
  return useQuery({
    queryFn: async () => {
      const response = await getMyEnrollments();
      if (!response.success) throw new Error(response.message || "Unable to load your learning.");
      return response.data;
    },
    queryKey: ["my-learning"],
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await enrollInCourse(courseId);
      if (!response.success) throw new Error(response.message || "Enrollment failed.");
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-learning"] });
    },
  });
}
