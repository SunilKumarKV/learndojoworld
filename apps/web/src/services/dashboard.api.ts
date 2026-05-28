import { apiClient, type ApiResponse } from "@/services/api-client";

export type DashboardLearnerProfile = {
  fullName: string;
  skillLevel: string;
  dailyGoalMin: number;
  goals: string[];
  topics: string[];
  learningStyle: string[];
};

export type DashboardLearnerStats = {
  enrolledCourses: number;
  completedLessons: number;
  currentStreak: number;
  xp: number;
  dailyGoalMin: number;
  todayLearningMin: number;
};

export type ContinueLearningItem = null | {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  progressPercent: number;
};

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  status: "planned" | "active" | "done";
  order: number;
};

export type RecommendationItem = {
  title: string;
  description: string;
  type: string;
};

export type DashboardLearnerResponse = {
  profile: DashboardLearnerProfile;
  stats: DashboardLearnerStats;
  continueLearning: ContinueLearningItem;
  roadmap: RoadmapItem[];
  recommendations: RecommendationItem[];
};

export async function getLearnerDashboard(): Promise<ApiResponse<DashboardLearnerResponse>> {
  return apiClient<DashboardLearnerResponse>("/dashboard/learner");
}
