import { Injectable, ServiceUnavailableException } from "@nestjs/common";

import { PrismaService } from "../../lib/prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      environment: process.env.NODE_ENV ?? "development",
      service: "learndojoworld-api",
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getReadiness() {
    const checks = {
      database: await this.checkDatabase(),
    };
    const ready = Object.values(checks).every((check) => check.status === "ok");

    if (!ready) {
      throw new ServiceUnavailableException({
        checks,
        message: "Service is not ready.",
      });
    }

    return {
      checks,
      service: "learndojoworld-api",
      status: "ready",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase() {
    const startedAt = process.hrtime.bigint();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        durationMs: elapsedMs(startedAt),
        status: "ok" as const,
      };
    } catch {
      return {
        durationMs: elapsedMs(startedAt),
        status: "error" as const,
      };
    }
  }
}

function elapsedMs(startedAt: bigint) {
  return Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
}
