"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { clearStoredAuth, me } from "@/services/auth.api";

export type SessionState = {
  user: Awaited<ReturnType<typeof me>> | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
};

export function useSession() {
  const query = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await me();
      } catch (error) {
        clearStoredAuth();
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const state = useMemo<SessionState>(
    () => ({
      user: query.data ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      errorMessage: query.error instanceof Error ? query.error.message : "",
    }),
    [query.data, query.error, query.isError, query.isLoading],
  );

  return {
    ...query,
    ...state,
  };
}
