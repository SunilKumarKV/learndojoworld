import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { LearningService } from "./learning.service";

class WatchLessonDto {
  watchedSec?: number;
  completed?: boolean;
}

@Controller("progress")
export class ProgressController {
  constructor(private readonly learningService: LearningService) {}

  @UseGuards(JwtAuthGuard)
  @Post("lessons/:lessonId/start")
  startLesson(@CurrentUser() user: AuthenticatedUser, @Param("lessonId") lessonId: string) {
    return this.learningService.startLesson(user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("lessons/:lessonId/watch")
  watchLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId") lessonId: string,
    @Body() dto: WatchLessonDto,
  ) {
    return this.learningService.watchLesson(user.id, lessonId, dto.watchedSec ?? 0, dto.completed);
  }

  @UseGuards(JwtAuthGuard)
  @Post("lessons/:lessonId/complete")
  completeLesson(@CurrentUser() user: AuthenticatedUser, @Param("lessonId") lessonId: string) {
    return this.learningService.completeLesson(user.id, lessonId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("courses/:courseId")
  getCourseProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("courseId") courseId: string,
  ) {
    return this.learningService.getCourseProgress(user.id, courseId);
  }
}
