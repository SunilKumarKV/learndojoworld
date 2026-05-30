import { apiClient, type ApiResponse } from "@/services/api-client";

export async function trackEvent(event: string, metadata: Record<string, unknown> = {}) {
  return apiClient<{ id: string }>("/analytics/events", {
    body: JSON.stringify({ event, metadata }),
    method: "POST",
  });
}

export async function getFounderAnalytics(): Promise<
  ApiResponse<{
    activeUsers30d: number;
    activeUsers7d: number;
    averageSessionTime: number;
    enrollments: number;
    flashcardsReviewed: number;
    lessonsCompleted: number;
    onboardingCompletionRate: number;
    quizzesCompleted: number;
    totalUsers: number;
  }>
> {
  return apiClient("/analytics/founder");
}

export async function getActivityTimeline(limit = 10) {
  return apiClient<Array<{ id: string; event: string; xpEarned: number; createdAt: string }>>(
    `/activity/timeline?limit=${limit}`,
  );
}

export async function getGamificationSummary() {
  return apiClient<{
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      xpReward: number;
      unlocked: boolean;
    }>;
    currentLevel: number;
    currentStreak: number;
    lastActiveDate: string | null;
    longestStreak: number;
    nextLevelProgress: number;
    nextLevelXp: number;
    xp: number;
  }>("/gamification/summary");
}
