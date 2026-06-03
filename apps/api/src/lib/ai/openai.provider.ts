import { ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";

import type { AIChatMessage, AIChatResponse, AIProvider } from "./ai.provider";

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const COST_PER_1K_TOKENS = 0.0002;

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    if (!apiKey) {
      throw new ServiceUnavailableException("AI provider is not configured");
    }

    this.client = new OpenAI({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async chat(messages: AIChatMessage[]): Promise<AIChatResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content?.trim() ?? "";

      if (!content) {
        throw new ServiceUnavailableException("OpenAI returned an empty chat response.");
      }

      const usage = response.usage ?? {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const promptTokens = Number(usage.prompt_tokens ?? 0);
      const completionTokens = Number(usage.completion_tokens ?? 0);
      const totalTokens = Number(usage.total_tokens ?? promptTokens + completionTokens);
      const cost = Number(((totalTokens / 1000) * COST_PER_1K_TOKENS).toFixed(6));

      return {
        content,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        cost,
      };
    } catch {
      // Translate provider/network errors to ServiceUnavailable for router fallback
      throw new ServiceUnavailableException("OpenAI provider error or unavailable");
    }
  }
}
