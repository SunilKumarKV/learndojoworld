import { Module } from "@nestjs/common";

import { PrismaModule } from "../../lib/prisma/prisma.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { MemoryController } from "./memory.controller";
import { MemoryService } from "./memory.service";

@Module({
  imports: [AnalyticsModule, PrismaModule],
  controllers: [MemoryController],
  providers: [MemoryService],
})
export class MemoryModule {}
