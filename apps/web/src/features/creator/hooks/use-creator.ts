"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  applyForCreator,
  createCreatorCourse,
  createCreatorLesson,
  createCreatorModule,
  deleteCreatorCourse,
  deleteCreatorLesson,
  deleteCreatorModule,
  getCreatorCourse,
  getCreatorCourses,
  getCreatorDashboard,
  getCreatorProfile,
  submitCreatorCourseForReview,
  updateCreatorCourse,
  updateCreatorLesson,
  updateCreatorModule,
  type CreatorCoursePayload,
  type CreatorLessonPayload,
  type CreatorModulePayload,
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

export function useCreatorCourse(courseId: string | undefined) {
  return useQuery({
    enabled: Boolean(courseId),
    queryFn: async () => {
      if (!courseId) throw new Error("Course id is required.");
      const response = await getCreatorCourse(courseId);
      if (!response.success) throw new Error(response.message || "Unable to load course.");
      return response.data;
    },
    queryKey: ["creator", "course", courseId],
  });
}

export function useCreatorCourseMutations(courseId: string | undefined) {
  const queryClient = useQueryClient();

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["creator", "courses"] }),
      courseId
        ? queryClient.invalidateQueries({ queryKey: ["creator", "course", courseId] })
        : Promise.resolve(),
    ]);
  }

  return {
    createCourse: useMutation({
      mutationFn: async (payload: CreatorCoursePayload) => {
        const response = await createCreatorCourse(payload);
        if (!response.success) throw new Error(response.message || "Unable to create course.");
        return response.data;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["creator", "courses"] });
        await queryClient.invalidateQueries({ queryKey: ["creator", "dashboard"] });
      },
    }),
    updateCourse: useMutation({
      mutationFn: async (payload: Partial<CreatorCoursePayload>) => {
        if (!courseId) throw new Error("Save basic info before editing.");
        const response = await updateCreatorCourse(courseId, payload);
        if (!response.success) throw new Error(response.message || "Unable to save course.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    deleteCourse: useMutation({
      mutationFn: async (id: string) => {
        const response = await deleteCreatorCourse(id);
        if (!response.success) throw new Error(response.message || "Unable to delete course.");
        return response.data;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["creator", "courses"] });
      },
    }),
    createModule: useMutation({
      mutationFn: async (payload: CreatorModulePayload) => {
        if (!courseId) throw new Error("Save basic info before adding modules.");
        const response = await createCreatorModule(courseId, payload);
        if (!response.success) throw new Error(response.message || "Unable to add module.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    updateModule: useMutation({
      mutationFn: async ({
        moduleId,
        payload,
      }: {
        moduleId: string;
        payload: CreatorModulePayload;
      }) => {
        const response = await updateCreatorModule(moduleId, payload);
        if (!response.success) throw new Error(response.message || "Unable to save module.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    deleteModule: useMutation({
      mutationFn: async (moduleId: string) => {
        const response = await deleteCreatorModule(moduleId);
        if (!response.success) throw new Error(response.message || "Unable to delete module.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    createLesson: useMutation({
      mutationFn: async ({
        moduleId,
        payload,
      }: {
        moduleId: string;
        payload: CreatorLessonPayload;
      }) => {
        const response = await createCreatorLesson(moduleId, payload);
        if (!response.success) throw new Error(response.message || "Unable to add lesson.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    updateLesson: useMutation({
      mutationFn: async ({
        lessonId,
        payload,
      }: {
        lessonId: string;
        payload: Partial<CreatorLessonPayload>;
      }) => {
        const response = await updateCreatorLesson(lessonId, payload);
        if (!response.success) throw new Error(response.message || "Unable to save lesson.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    deleteLesson: useMutation({
      mutationFn: async (lessonId: string) => {
        const response = await deleteCreatorLesson(lessonId);
        if (!response.success) throw new Error(response.message || "Unable to delete lesson.");
        return response.data;
      },
      onSuccess: refresh,
    }),
    submitForReview: useMutation({
      mutationFn: async () => {
        if (!courseId) throw new Error("Save the course before submitting.");
        const response = await submitCreatorCourseForReview(courseId);
        if (!response.success) throw new Error(response.message || "Unable to submit course.");
        return response.data;
      },
      onSuccess: refresh,
    }),
  };
}
