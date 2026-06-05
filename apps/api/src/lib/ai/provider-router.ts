import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { AIChatMessage, AIChatResponse, AIProvider } from "./ai.provider";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";
import { TestAIProvider } from "./test.provider";

type ProviderName = "OPENAI" | "GEMINI" | "TEST";
type ProviderSlug = "openai" | "gemini" | "test";

export type ProviderResult = AIChatResponse & {
  provider: ProviderSlug;
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
    this.primaryName =
      primaryUpper === "TEST" && this.env.NODE_ENV === "test"
        ? "TEST"
        : primaryUpper === "GEMINI"
          ? "GEMINI"
          : "OPENAI";

    const fb = this.env.AI_FALLBACK_PROVIDER;
    if (fb) {
      const fbUpper = fb.toString().toUpperCase();
      if (fbUpper === "GEMINI") {
        this.fallbackName = "GEMINI";
      } else if (fbUpper === "OPENAI") {
        this.fallbackName = "OPENAI";
      } else if (fbUpper === "TEST" && this.env.NODE_ENV === "test") {
        this.fallbackName = "TEST";
      }
    }
  }

  private createProvider(name: ProviderName): AIProvider {
    switch (name) {
      case "OPENAI":
        return new OpenAIProvider(this.env.OPENAI_API_KEY || undefined, this.env.OPENAI_MODEL);
      case "GEMINI":
        return new GeminiProvider(this.env.GEMINI_API_KEY || undefined, this.env.GEMINI_MODEL);
      case "TEST":
        if (this.env.NODE_ENV !== "test") {
          throw new InternalServerErrorException("Unknown provider");
        }

        return new TestAIProvider();
      default:
        throw new InternalServerErrorException("Unknown provider");
    }
  }

  async chat(messages: AIChatMessage[]): Promise<ProviderResult> {
    const tried: Array<{ name: ProviderName; err?: unknown }> = [];

    const tryProvider = async (name: ProviderName) => {
      try {
        const provider = this.createProvider(name);
        const res = await provider.chat(messages);
        const modelKey =
          name === "OPENAI" ? "OPENAI_MODEL" : name === "GEMINI" ? "GEMINI_MODEL" : "TEST_AI_MODEL";
        const providerSlug: ProviderSlug =
          name === "GEMINI" ? "gemini" : name === "TEST" ? "test" : "openai";
        return {
          ...res,
          provider: providerSlug,
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
