import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

import { AppLogger } from "../../lib/observability/app-logger";

const logger = new AppLogger("Request");

export function requestLoggingMiddleware(request: Request, response: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();
  const requestId = readRequestId(request) ?? randomUUID();

  response.setHeader("x-request-id", requestId);

  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = response.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    logger[level]("http_request", {
      durationMs: Math.round(durationMs),
      method: request.method,
      path: request.originalUrl ?? request.url,
      requestId,
      statusCode,
    });
  });

  next();
}

function readRequestId(request: Request) {
  const requestId = request.header("x-request-id");

  if (!requestId || requestId.length > 128) {
    return undefined;
  }

  return requestId;
}
