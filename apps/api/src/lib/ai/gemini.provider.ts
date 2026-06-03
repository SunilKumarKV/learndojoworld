import { ServiceUnavailableException } from "@nestjs/common";

import type { AIChatMessage, AIChatResponse, AIProvider } from "./ai.provider";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const GEMINI_BASE_URL = "https://gemini.googleapis.com/v1/models";

type GeminiUsage = {
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

type GeminiResponse = {
  candidates?: unknown;
  usage?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractGeminiText(candidate: unknown): string {
  if (!isObject(candidate)) {
    return "";
  }

  const content = (candidate as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const typedItem = item as { text?: unknown; segments?: unknown };
      if (typeof typedItem.text === "string") {
        return typedItem.text;
      }

      if (Array.isArray(typedItem.segments)) {
        return typedItem.segments
          .map((segment) =>
            segment && typeof (segment as { text?: unknown }).text === "string"
              ? (segment as { text: string }).text
              : "",
          )
          .join("");
      }

      return "";
    })
    .join("");
}

export class GeminiProvider implements AIProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    if (!apiKey) {
      throw new ServiceUnavailableException("AI provider is not configured");
    }

    this.apiKey = apiKey;
    this.model = model ?? DEFAULT_MODEL;
  }

  async chat(messages: AIChatMessage[]): Promise<AIChatResponse> {
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

    const url = `${GEMINI_BASE_URL}/${encodeURIComponent(this.model)}:generateMessage?key=${encodeURIComponent(
      this.apiKey,
    )}`;

    try {
      const fetchFn = (globalThis as unknown as { fetch?: unknown }).fetch;
      if (typeof fetchFn !== "function") {
        throw new ServiceUnavailableException("Gemini provider is not available");
      }

      type FetchFn = (input: unknown, init?: unknown) => Promise<unknown>;
      const response = await (fetchFn as FetchFn)(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            author: "user",
            content: [{ type: "text", text: prompt }],
          },
          temperature: 0.7,
          maxOutputTokens: 1024,
        }),
      });

      if (
        !isObject(response) ||
        typeof response.ok !== "boolean" ||
        typeof response.json !== "function"
      ) {
        throw new ServiceUnavailableException("Gemini provider error or unavailable");
      }

      const body = await (response.json as () => Promise<unknown>)();
      const geminiBody = isObject(body) ? (body as GeminiResponse) : {};

      if (!response.ok) {
        throw new ServiceUnavailableException("Gemini provider error or unavailable");
      }

      const candidate = Array.isArray(geminiBody.candidates)
        ? (geminiBody.candidates as unknown[])[0]
        : undefined;
      const content = extractGeminiText(candidate);

      if (!content) {
        throw new ServiceUnavailableException("Gemini returned an empty response.");
      }

      const usage = isObject(geminiBody.usage) ? (geminiBody.usage as GeminiUsage) : {};
      const promptTokens = Number(usage.promptTokens ?? 0);
      const completionTokens = Number(usage.outputTokens ?? 0);
      const totalTokens = Number(usage.totalTokens ?? promptTokens + completionTokens);

      return {
        content,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        cost: 0,
      };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException("Gemini provider error or unavailable");
    }
  }
}
