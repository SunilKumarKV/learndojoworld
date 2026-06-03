import { apiClient } from "@/services/api-client";

export type AIInstruction =
  | "EXPLAIN_SIMPLE"
  | "REAL_EXAMPLE"
  | "QUIZ_ME"
  | "SUMMARIZE"
  | "CREATE_FLASHCARDS";

export type AIConversationSummary = {
  id: string;
  title: string;
  courseId?: string | null;
  lessonId?: string | null;
  totalTokens: number;
  totalCost: number;
  updatedAt: string;
  lastMessage: string;
  lastMessageRole: string;
  lastMessageAt?: string | null;
};

export type AIConversationDetail = {
  id: string;
  title?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  totalTokens: number;
  totalCost: number;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
};

export type AIChatRequest = {
  conversationId: string | undefined;
  courseId: string | undefined;
  lessonId: string | undefined;
  instruction: AIInstruction | undefined;
  message: string;
};

export type AIChatResponse = {
  conversationId: string;
  message: {
    id: string;
    role: string;
    content: string;
    createdAt: string;
  };
  answer: string | null;
  provider: string;
  model: string;
  fallbackUsed: boolean;
  aiUsage: {
    messagesToday: number;
    remainingToday: number;
    dailyLimit: number;
    costToday: number;
  };
};

export async function chatWithAI(payload: AIChatRequest) {
  return apiClient<AIChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAIConversations() {
  return apiClient<AIConversationSummary[]>("/ai/conversations");
}

export async function getAIConversation(conversationId: string) {
  return apiClient<AIConversationDetail>(`/ai/conversations/${conversationId}`);
}

export async function deleteAIConversation(conversationId: string) {
  return apiClient<null>(`/ai/conversations/${conversationId}`, {
    method: "DELETE",
  });
}
