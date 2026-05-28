"use client";

import { useQuery } from "@tanstack/react-query";

import { getLearnerDashboard } from "@/services/dashboard.api";

export function useDashboard() {
  return useQuery({
    queryFn: async () => {
      const response = await getLearnerDashboard();
      if (!response.success) {
        throw new Error(response.message || "Unable to load your learner dashboard.");
      }
      return response.data;
    },
    queryKey: ["dashboard-learner"],
    retry: false,
    staleTime: 30_000,
  });
}
