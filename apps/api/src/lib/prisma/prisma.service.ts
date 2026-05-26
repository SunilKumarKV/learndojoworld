import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { EnvironmentVariables } from "../../config/env.validation";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly databaseUrl: string;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    this.databaseUrl = this.configService.get("DATABASE_URL", { infer: true });
  }

  async onModuleInit() {
    // PrismaClient will be connected here after the schema is introduced.
  }

  async onModuleDestroy() {
    // PrismaClient will be disconnected here after the schema is introduced.
  }
}
