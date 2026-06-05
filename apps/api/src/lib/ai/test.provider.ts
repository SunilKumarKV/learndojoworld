import type { AIChatMessage, AIChatResponse, AIProvider } from "./ai.provider";

export class TestAIProvider implements AIProvider {
  chat(messages: AIChatMessage[]): Promise<AIChatResponse> {
    const userMessage = [...messages].reverse().find((message) => message.role === "user");
    const content = userMessage?.content.trim() || "No learner message provided.";

    return Promise.resolve({
      content: `Test tutor response: ${content}`,
      cost: 0,
      usage: {
        completionTokens: 6,
        promptTokens: Math.max(
          1,
          Math.ceil(messages.map((message) => message.content).join(" ").length / 4),
        ),
        totalTokens: 12,
      },
    });
  }
}
