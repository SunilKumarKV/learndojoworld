import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { LearningService } from "./learning.service";

@Controller("learning")
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @UseGuards(JwtAuthGuard)
  @Get("continue")
  getContinueLearning(@CurrentUser() user: AuthenticatedUser) {
    return this.learningService.getContinueLearning(user.id);
  }
}
