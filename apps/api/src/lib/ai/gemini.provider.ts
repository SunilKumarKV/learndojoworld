import { ServiceUnavailableException } from "@nestjs/common";

import type { AIChatMessage, AIChatResponse, AIProvider } from "./ai.provider";

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_COMPATIBILITY_MODEL = "gemini-flash-latest";

type GeminiUsage = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

type GeminiResponse = {
  candidates?: unknown;
  usageMetadata?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractGeminiText(candidate: unknown): string {
  if (!isObject(candidate)) {
    return "";
  }

  const content = (candidate as { content?: unknown }).content;
  if (!isObject(content) || !Array.isArray(content.parts)) {
    return "";
  }

  return content.parts
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }

      const typedItem = item as { text?: unknown };
      if (typeof typedItem.text === "string") {
        return typedItem.text;
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

    try {
      const geminiBody = await this.generateContent(this.model, prompt);

      const candidate = Array.isArray(geminiBody.candidates)
        ? (geminiBody.candidates as unknown[])[0]
        : undefined;
      const content = extractGeminiText(candidate);

      if (!content) {
        throw new ServiceUnavailableException("Gemini returned an empty response.");
      }

      const usage = isObject(geminiBody.usageMetadata)
        ? (geminiBody.usageMetadata as GeminiUsage)
        : {};
      const promptTokens = Number(usage.promptTokenCount ?? 0);
      const completionTokens = Number(usage.candidatesTokenCount ?? 0);
      const totalTokens = Number(usage.totalTokenCount ?? promptTokens + completionTokens);

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

  private async generateContent(model: string, prompt: string): Promise<GeminiResponse> {
    const fetchFn = (globalThis as unknown as { fetch?: unknown }).fetch;
    if (typeof fetchFn !== "function") {
      throw new ServiceUnavailableException("Gemini provider is not available");
    }

    const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
      this.apiKey,
    )}`;

    type FetchFn = (input: unknown, init?: unknown) => Promise<unknown>;
    const response = await (fetchFn as FetchFn)(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
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
      if (model !== GEMINI_COMPATIBILITY_MODEL && isModelNotFound(body)) {
        return this.generateContent(GEMINI_COMPATIBILITY_MODEL, prompt);
      }

      throw new ServiceUnavailableException("Gemini provider error or unavailable");
    }

    return geminiBody;
  }
}

function isModelNotFound(body: unknown) {
  if (!isObject(body) || !isObject(body.error)) {
    return false;
  }

  return body.error.status === "NOT_FOUND" || body.error.code === 404;
}
