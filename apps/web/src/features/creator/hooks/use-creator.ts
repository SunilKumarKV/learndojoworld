"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyForCreator,
  getCreatorCourses,
  getCreatorDashboard,
  getCreatorProfile,
  updateCreatorProfile,
  type CreatorProfilePayload,
} from "@/services/creator.api";

export function useCreatorProfile(enabled = true) {
  return useQuery({
    enabled,
    queryFn: async () => {
      const response = await getCreatorProfile();
      if (!response.success) throw new Error(response.message || "Unable to load creator profile.");
      return response.data;
    },
    queryKey: ["creator", "profile"],
  });
}

export function useCreatorApply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatorProfilePayload) => {
      const response = await applyForCreator(payload);
      if (!response.success) throw new Error(response.message || "Unable to become a creator.");
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["session"] }),
        queryClient.invalidateQueries({ queryKey: ["creator"] }),
      ]);
    },
  });
}

export function useCreatorProfileUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatorProfilePayload) => {
      const response = await updateCreatorProfile(payload);
      if (!response.success) throw new Error(response.message || "Unable to update profile.");
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["creator", "profile"] });
    },
  });
}

export function useCreatorDashboard(enabled = true) {
  return useQuery({
    enabled,
    queryFn: async () => {
      const response = await getCreatorDashboard();
      if (!response.success) {
        throw new Error(response.message || "Unable to load creator dashboard.");
      }
      return response.data;
    },
    queryKey: ["creator", "dashboard"],
  });
}

export function useCreatorCourses(enabled = true) {
  return useQuery({
    enabled,
    queryFn: async () => {
      const response = await getCreatorCourses();
      if (!response.success) throw new Error(response.message || "Unable to load creator courses.");
      return response.data;
    },
    queryKey: ["creator", "courses"],
  });
}
