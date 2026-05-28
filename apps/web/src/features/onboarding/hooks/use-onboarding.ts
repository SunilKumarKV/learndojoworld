"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { submitLearnerOnboarding, storeOnboardingProfile } from "@/services/onboarding.api";
import type { OnboardingFormValues } from "@/features/onboarding/schemas/onboarding.schema";

export function useOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: OnboardingFormValues) => {
      const response = await submitLearnerOnboarding(payload);
      if (!response.success) {
        throw new Error(response.message || "We could not save your onboarding details.");
      }

      storeOnboardingProfile(payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["session"] }),
        queryClient.invalidateQueries({ queryKey: ["onboarding-status"] }),
      ]);

      return response.data;
    },
    onSuccess: () => {
      router.replace("/dashboard");
    },
  });
}
