"use client";

import { useQuery } from "@tanstack/react-query";

import { getLearnerOnboarding } from "@/services/onboarding.api";

export function useOnboardingStatus(enabled = true, userId?: string | null) {
  return useQuery({
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const response = await getLearnerOnboarding();

      if (!response.success) {
        throw new Error(response.message || "Unable to load onboarding status.");
      }

      return response.data;
    },
    queryKey: ["onboarding-status", userId ?? "anonymous"],
    retry: false,
    staleTime: 30_000,
  });
}
