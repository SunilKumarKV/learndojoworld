import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import "reflect-metadata";

import { AppModule } from "./app.module";
import { API_PREFIX } from "./common/constants/api.constants";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ApiResponseInterceptor } from "./common/interceptors/api-response.interceptor";
import type { EnvironmentVariables } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables, true>);
  const webOrigin = configService.get("WEB_ORIGIN", { infer: true });
  const apiPort = configService.get("API_PORT", { infer: true });

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({
    credentials: true,
    origin: webOrigin,
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
}

void bootstrap();
