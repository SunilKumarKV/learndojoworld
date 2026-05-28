import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  controllers: [OnboardingController],
  imports: [JwtModule.register({})],
  providers: [JwtAuthGuard, OnboardingService],
})
export class OnboardingModule {}
