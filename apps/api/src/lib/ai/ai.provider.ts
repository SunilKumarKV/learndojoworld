export type AIMessageRole = "system" | "user" | "assistant";

export type AIChatMessage = {
  role: AIMessageRole;
  content: string;
};

export type AIChatUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AIChatResponse = {
  content: string;
  usage: AIChatUsage;
  cost: number;
};

export interface AIProvider {
  chat(messages: AIChatMessage[]): Promise<AIChatResponse>;
}
