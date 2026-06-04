import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { API_PREFIX } from "./common/constants/api.constants";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ApiResponseInterceptor } from "./common/interceptors/api-response.interceptor";
import { requestLoggingMiddleware } from "./common/middleware/request-logging.middleware";
import type { EnvironmentVariables } from "./config/env.validation";
import { AppLogger } from "./lib/observability/app-logger";
import { initSentry, isSentryEnabled } from "./lib/observability/sentry";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const logger = new AppLogger("Bootstrap");
  const webOrigin = configService.get("WEB_ORIGIN", { infer: true });
  const apiPort = configService.get("API_PORT", { infer: true });
  const nodeEnv = configService.get("NODE_ENV", { infer: true });
  const allowedOrigins = parseAllowedOrigins(webOrigin, nodeEnv);

  initSentry({
    AI_FALLBACK_PROVIDER: configService.get("AI_FALLBACK_PROVIDER", { infer: true }),
    AI_PRIMARY_PROVIDER: configService.get("AI_PRIMARY_PROVIDER", { infer: true }),
    AI_PROVIDER: configService.get("AI_PROVIDER", { infer: true }),
    API_PORT: apiPort,
    DATABASE_URL: configService.get("DATABASE_URL", { infer: true }),
    GEMINI_API_KEY: configService.get("GEMINI_API_KEY", { infer: true }),
    GEMINI_MODEL: configService.get("GEMINI_MODEL", { infer: true }),
    JWT_REFRESH_SECRET: configService.get("JWT_REFRESH_SECRET", { infer: true }),
    JWT_SECRET: configService.get("JWT_SECRET", { infer: true }),
    LOG_LEVEL: configService.get("LOG_LEVEL", { infer: true }),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: configService.get("NEXT_PUBLIC_RAZORPAY_KEY_ID", {
      infer: true,
    }),
    NODE_ENV: nodeEnv,
    OPENAI_API_KEY: configService.get("OPENAI_API_KEY", { infer: true }),
    OPENAI_MODEL: configService.get("OPENAI_MODEL", { infer: true }),
    RAZORPAY_KEY_ID: configService.get("RAZORPAY_KEY_ID", { infer: true }),
    RAZORPAY_KEY_SECRET: configService.get("RAZORPAY_KEY_SECRET", { infer: true }),
    RAZORPAY_WEBHOOK_SECRET: configService.get("RAZORPAY_WEBHOOK_SECRET", { infer: true }),
    REDIS_URL: configService.get("REDIS_URL", { infer: true }),
    SENTRY_DSN: configService.get("SENTRY_DSN", { infer: true }),
    SENTRY_ENVIRONMENT: configService.get("SENTRY_ENVIRONMENT", { infer: true }),
    SENTRY_TRACES_SAMPLE_RATE: configService.get("SENTRY_TRACES_SAMPLE_RATE", { infer: true }),
    STRIPE_SECRET_KEY: configService.get("STRIPE_SECRET_KEY", { infer: true }),
    STRIPE_WEBHOOK_SECRET: configService.get("STRIPE_WEBHOOK_SECRET", { infer: true }),
    WEB_ORIGIN: webOrigin,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'", ...allowedOrigins],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          upgradeInsecureRequests: nodeEnv === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  app.use(requestLoggingMiddleware);
  app.enableCors({
    credentials: true,
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (nodeEnv !== "production") {
        logger.warn("cors_origin_rejected", { origin });
      }

      callback(new Error("CORS origin is not allowed."));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());

  await app.listen(apiPort);

  logger.info("api_started", {
    port: apiPort,
    sentryEnabled: isSentryEnabled(),
  });
}

void bootstrap();

function parseAllowedOrigins(webOrigin: string, nodeEnv: string) {
  const origins = webOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv !== "production") {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return Array.from(new Set(origins)).filter((origin) => origin !== "*");
}
