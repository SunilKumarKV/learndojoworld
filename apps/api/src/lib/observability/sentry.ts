import * as Sentry from "@sentry/node";

import type { EnvironmentVariables } from "../../config/env.validation";

let sentryEnabled = false;

export function initSentry(config: EnvironmentVariables) {
  if (!config.SENTRY_DSN) {
    sentryEnabled = false;
    return false;
  }

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.SENTRY_ENVIRONMENT ?? config.NODE_ENV,
    tracesSampleRate: config.SENTRY_TRACES_SAMPLE_RATE,
  });

  sentryEnabled = true;
  return true;
}

export function captureException(exception: unknown, extra?: Record<string, unknown>) {
  if (!sentryEnabled) {
    return;
  }

  if (!extra) {
    Sentry.captureException(exception);
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(extra)) {
      scope.setExtra(key, value);
    }

    Sentry.captureException(exception);
  });
}

export function isSentryEnabled() {
  return sentryEnabled;
}
