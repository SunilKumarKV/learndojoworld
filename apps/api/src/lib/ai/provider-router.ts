import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { AIChatMessage, AIChatResponse, AIProvider } from "./ai.provider";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";

type ProviderName = "OPENAI" | "GEMINI";

export type ProviderResult = AIChatResponse & {
  provider: ProviderName;
  model: string;
  fallbackUsed?: boolean;
};

@Injectable()
export class AIProviderRouter {
  private primaryName: ProviderName;
  private fallbackName?: ProviderName;

  constructor(private readonly env: NodeJS.ProcessEnv) {
    const primaryRaw = (
      this.env.AI_PRIMARY_PROVIDER ??
      this.env.AI_PROVIDER ??
      "OPENAI"
    ).toString();
    const primaryUpper = primaryRaw.toUpperCase();
    this.primaryName = primaryUpper === "GEMINI" ? "GEMINI" : "OPENAI";

    const fb = this.env.AI_FALLBACK_PROVIDER;
    if (fb) {
      const fbUpper = fb.toString().toUpperCase();
      if (fbUpper === "GEMINI") {
        this.fallbackName = "GEMINI";
      } else if (fbUpper === "OPENAI") {
        this.fallbackName = "OPENAI";
      }
    }
  }

  private createProvider(name: ProviderName): AIProvider {
    switch (name) {
      case "OPENAI":
        return new OpenAIProvider(this.env.OPENAI_API_KEY || undefined, this.env.OPENAI_MODEL);
      case "GEMINI":
        return new GeminiProvider(this.env.GEMINI_API_KEY || undefined, this.env.GEMINI_MODEL);
      default:
        throw new InternalServerErrorException("Unknown provider");
    }
  }

  async chat(messages: AIChatMessage[]): Promise<ProviderResult> {
    const tried: Array<{ name: ProviderName; err?: unknown }> = [];

    const tryProvider = async (name: ProviderName) => {
      const provider = this.createProvider(name);
      try {
        const res = await provider.chat(messages);
        const modelKey = name === "OPENAI" ? "OPENAI_MODEL" : "GEMINI_MODEL";
        return {
          ...res,
          provider: name,
          model: this.env[modelKey] ?? "unknown",
        };
      } catch (err) {
        // Only fallback for provider-level issues
        if (err instanceof ServiceUnavailableException) {
          tried.push({ name, err });
          return undefined;
        }

        // Non-retryable error; rethrow
        throw err;
      }
    };

    // Try primary
    const primary = await tryProvider(this.primaryName);
    if (primary) {
      return { ...primary, fallbackUsed: false };
    }

    // Try fallback if configured
    if (this.fallbackName && this.fallbackName !== this.primaryName) {
      const fbResult = await tryProvider(this.fallbackName);
      if (fbResult) {
        return { ...fbResult, fallbackUsed: true };
      }
    }

    // All providers failed
    throw new ServiceUnavailableException(
      "AI service is temporarily unavailable. Please try again later.",
    );
  }
}
