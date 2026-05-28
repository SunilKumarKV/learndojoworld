"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  clearStoredAuth,
  login,
  logout as apiLogout,
  persistAuthTokens,
  register,
} from "@/services/auth.api";
import { getLearnerOnboarding } from "@/services/onboarding.api";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (payload: { identifier: string; password: string }) => {
      const response = await login(payload);
      if (!response.success) {
        throw new Error(response.message || "Unable to sign in.");
      }
      persistAuthTokens(response.data.tokens);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      username: string;
      email: string;
      password: string;
    }) => {
      const response = await register(payload);
      if (!response.success) {
        throw new Error(response.message || "Unable to register.");
      }
      persistAuthTokens(response.data.tokens);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["session"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiLogout();
    },
    onSettled: () => {
      clearStoredAuth();
      queryClient.clear();
      router.replace("/login");
    },
  });

  const logoutUser = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const resolvePostAuthRoute = useCallback(async () => {
    const response = await getLearnerOnboarding();

    if (!response.success) {
      throw new Error(response.message || "We could not load your onboarding status.");
    }

    return response.data.completed ? "/dashboard" : "/onboarding";
  }, []);

  const signIn = useCallback(
    async (payload: { identifier: string; password: string }) => {
      await loginMutation.mutateAsync(payload);
      const nextRoute = await resolvePostAuthRoute();
      router.replace(nextRoute);
    },
    [loginMutation, resolvePostAuthRoute, router],
  );

  const signUp = useCallback(
    async (payload: { name: string; username: string; email: string; password: string }) => {
      await registerMutation.mutateAsync(payload);
      const nextRoute = await resolvePostAuthRoute();
      router.replace(nextRoute);
    },
    [registerMutation, resolvePostAuthRoute, router],
  );

  return {
    signIn,
    signUp,
    logout: logoutUser,
    loginState: loginMutation,
    registerState: registerMutation,
    logoutState: logoutMutation,
  };
}
