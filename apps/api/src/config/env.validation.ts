export type EnvironmentVariables = {
  API_PORT: number;
  DATABASE_URL: string;
  JWT_REFRESH_SECRET: string;
  JWT_SECRET: string;
  NODE_ENV: string;
  REDIS_URL?: string;
  WEB_ORIGIN: string;
  OPENAI_API_KEY: string | undefined;
  OPENAI_MODEL: string | undefined;
  GEMINI_API_KEY: string | undefined;
  GEMINI_MODEL: string | undefined;
  AI_PROVIDER: string;
  AI_PRIMARY_PROVIDER: string | undefined;
  AI_FALLBACK_PROVIDER: string | undefined;
  STRIPE_SECRET_KEY: string | undefined;
  STRIPE_WEBHOOK_SECRET: string | undefined;
  RAZORPAY_KEY_ID: string | undefined;
  RAZORPAY_KEY_SECRET: string | undefined;
  RAZORPAY_WEBHOOK_SECRET: string | undefined;
  NEXT_PUBLIC_RAZORPAY_KEY_ID: string | undefined;
};

const DEFAULTS = {
  API_PORT: 4000,
  NODE_ENV: "development",
  WEB_ORIGIN: "http://localhost:3000",
  AI_PROVIDER: "OPENAI",
} as const;

const REQUIRED_KEYS = ["DATABASE_URL", "REDIS_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"] as const;

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const missingKeys = REQUIRED_KEYS.filter((key) => !readString(config[key]));

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }

  return {
    API_PORT: readPort(config.API_PORT) ?? DEFAULTS.API_PORT,
    DATABASE_URL: readString(config.DATABASE_URL),
    JWT_REFRESH_SECRET: readString(config.JWT_REFRESH_SECRET),
    JWT_SECRET: readString(config.JWT_SECRET),
    NODE_ENV: readString(config.NODE_ENV) || DEFAULTS.NODE_ENV,
    REDIS_URL: readString(config.REDIS_URL),
    WEB_ORIGIN: readString(config.WEB_ORIGIN) || DEFAULTS.WEB_ORIGIN,
    OPENAI_API_KEY: readString(config.OPENAI_API_KEY) || undefined,
    OPENAI_MODEL: readString(config.OPENAI_MODEL) || undefined,
    GEMINI_API_KEY: readString(config.GEMINI_API_KEY) || undefined,
    GEMINI_MODEL: readString(config.GEMINI_MODEL) || undefined,
    AI_PROVIDER: readString(config.AI_PROVIDER) || DEFAULTS.AI_PROVIDER,
    AI_PRIMARY_PROVIDER: readString(config.AI_PRIMARY_PROVIDER) || undefined,
    AI_FALLBACK_PROVIDER: readString(config.AI_FALLBACK_PROVIDER) || undefined,
    STRIPE_SECRET_KEY: readString(config.STRIPE_SECRET_KEY) || undefined,
    STRIPE_WEBHOOK_SECRET: readString(config.STRIPE_WEBHOOK_SECRET) || undefined,
    RAZORPAY_KEY_ID: readString(config.RAZORPAY_KEY_ID) || undefined,
    RAZORPAY_KEY_SECRET: readString(config.RAZORPAY_KEY_SECRET) || undefined,
    RAZORPAY_WEBHOOK_SECRET: readString(config.RAZORPAY_WEBHOOK_SECRET) || undefined,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: readString(config.NEXT_PUBLIC_RAZORPAY_KEY_ID) || undefined,
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readPort(value: unknown) {
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    return undefined;
  }

  return port;
}
