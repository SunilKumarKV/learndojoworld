import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { LearnerOnboardingDto } from "./dto/learner-onboarding.dto";
import { OnboardingService } from "./onboarding.service";

@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @UseGuards(JwtAuthGuard)
  @Post("learner")
  saveLearnerOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() dto: LearnerOnboardingDto) {
    return this.onboardingService.saveLearnerOnboarding(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("learner")
  getLearnerOnboarding(@CurrentUser() user: AuthenticatedUser) {
    return this.onboardingService.getLearnerOnboarding(user.id);
  }
}
