import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";

import { AppLogger } from "../../lib/observability/app-logger";
import { captureException } from "../../lib/observability/sentry";
import type { ApiErrorResponse } from "../types/api-response.type";

type NestExceptionPayload = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status =
      isHttpException && exception.getStatus()
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttpException ? exception.getResponse() : undefined;
    const normalized = this.normalizePayload(payload);
    const isProduction = process.env.NODE_ENV === "production";
    const isUnexpectedError = !isHttpException || status >= 500;
    const requestContext = {
      method: request.method,
      path: request.url,
      statusCode: status,
    };

    if (isUnexpectedError) {
      this.logger.error("api_exception", {
        ...requestContext,
        errorName: getErrorName(exception),
        message: isProduction ? "Unexpected server error." : getErrorMessage(exception),
      });
      captureException(exception, requestContext);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: normalized.error ?? HttpStatus[status] ?? "INTERNAL_SERVER_ERROR",
        message:
          isUnexpectedError && isProduction
            ? "Unexpected server error."
            : (normalized.message ?? "Unexpected server error."),
      },
      meta: {
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(body);
  }

  private normalizePayload(payload: unknown): NestExceptionPayload {
    if (typeof payload === "string") {
      return { message: payload };
    }

    if (payload && typeof payload === "object") {
      return payload;
    }

    return {};
  }
}

function getErrorName(exception: unknown) {
  return exception instanceof Error ? exception.name : typeof exception;
}

function getErrorMessage(exception: unknown) {
  if (exception instanceof Error) {
    return exception.message;
  }

  if (typeof exception === "string") {
    return exception;
  }

  return "Unknown error";
}
