import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

import type { ApiErrorResponse } from "../types/api-response.type";

type NestExceptionPayload = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const normalized = this.normalizePayload(payload);

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: normalized.error ?? HttpStatus[status] ?? "INTERNAL_SERVER_ERROR",
        message: normalized.message ?? "Unexpected server error.",
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
