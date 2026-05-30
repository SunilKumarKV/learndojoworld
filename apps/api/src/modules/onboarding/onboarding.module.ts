import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AnalyticsModule } from "../analytics/analytics.module";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  controllers: [OnboardingController],
  imports: [AnalyticsModule, JwtModule.register({})],
  providers: [JwtAuthGuard, OnboardingService],
})
export class OnboardingModule {}
