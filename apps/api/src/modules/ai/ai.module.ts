import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { BillingModule } from "../billing/billing.module";
import { AIController } from "./ai.controller";
import { AIService } from "./ai.service";

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [AIController],
  providers: [AIService],
})
export class AIModule {}
