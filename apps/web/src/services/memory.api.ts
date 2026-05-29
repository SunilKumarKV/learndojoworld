import { apiClient, type ApiResponse } from "@/services/api-client";

export type Quiz = {
  id: string;
  title: string;
  passScore: number;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    explanation?: string | null;
    points: number;
  }>;
};

export type QuizAttemptResult = {
  attempt: { id: string; score: number; passed: boolean };
  explanations: Array<{ explanation: string; question: string }>;
  passed: boolean;
  score: number;
  weakTopics: string[];
};

export function getQuizzes(): Promise<
  ApiResponse<Array<{ id: string; title: string; passScore: number }>>
> {
  return apiClient<Array<{ id: string; title: string; passScore: number }>>("/quizzes");
}

export async function getQuiz(id: string): Promise<ApiResponse<Quiz>> {
  return apiClient<Quiz>(`/quizzes/${id}`);
}

export async function submitQuizAttempt(id: string, answers: Record<string, unknown>) {
  return apiClient<{
    attempt: { id: string; score: number; passed: boolean };
    score: number;
    passed: boolean;
    weakTopics: string[];
    explanations: string[];
  }>(`/quizzes/${id}/attempts`, { body: JSON.stringify({ answers }), method: "POST" });
}

export async function getQuizResults(id: string) {
  return apiClient<QuizAttemptResult>(`/quizzes/${id}/results`);
}

export async function getMyFlashcards() {
  return apiClient<Array<{ id: string; front: string; back: string; tags: string[] }>>(
    "/flashcards/me",
  );
}

export async function createFlashcard(payload: {
  front: string;
  back: string;
  tags?: string[];
  lessonId?: string;
  courseId?: string;
}) {
  return apiClient<{ id: string }>("/flashcards", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function reviewFlashcard(id: string, difficulty: "FORGOT" | "HARD" | "GOOD" | "EASY") {
  return apiClient<{ difficulty: string; nextReviewAt: string }>(`/flashcards/${id}/review`, {
    body: JSON.stringify({ difficulty }),
    method: "POST",
  });
}

export async function getReviewDue(limit = 10) {
  return apiClient<Array<{ id: string; front: string; back: string; tags: string[] }>>(
    `/flashcards/review-due?limit=${limit}`,
  );
}

export async function getRevisionDashboard() {
  return apiClient<{
    averageScore: number;
    dueToday: number;
    totalFlashcards: number;
    upcomingReviews: number;
    weakTopics: string[];
  }>("/revision/dashboard");
}
