import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable, map } from "rxjs";

import type { ApiSuccessResponse } from "../types/api-response.type";

@Injectable()
export class ApiResponseInterceptor<TData> implements NestInterceptor<
  TData,
  ApiSuccessResponse<TData>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<TData>,
  ): Observable<ApiSuccessResponse<TData>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          path: request.url,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
