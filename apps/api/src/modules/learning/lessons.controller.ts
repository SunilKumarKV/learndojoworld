import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { LearningService } from "./learning.service";

@Controller("lessons")
export class LessonsController {
  constructor(private readonly learningService: LearningService) {}

  @UseGuards(JwtAuthGuard)
  @Get(":lessonId")
  getLesson(@CurrentUser() user: AuthenticatedUser, @Param("lessonId") lessonId: string) {
    return this.learningService.getLessonById(user.id, lessonId);
  }
}
