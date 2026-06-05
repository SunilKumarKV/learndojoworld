import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { MemoryService } from "./memory.service";

@Controller("")
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @UseGuards(JwtAuthGuard)
  @Get("quizzes")
  getQuizzes(@CurrentUser() user: AuthenticatedUser) {
    return this.memoryService.getQuizzes(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("quizzes/:id")
  getQuiz(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.memoryService.getQuiz(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("quizzes/:id/attempts")
  submitAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("answers") answers: Record<string, unknown>,
  ) {
    return this.memoryService.submitAttempt(user, id, answers ?? {});
  }

  @UseGuards(JwtAuthGuard)
  @Get("quizzes/:id/results")
  getResults(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.memoryService.getResults(user, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("flashcards/me")
  getMyFlashcards(@CurrentUser() user: AuthenticatedUser) {
    return this.memoryService.getMyFlashcards(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("flashcards")
  createFlashcard(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: { front: string; back: string; tags?: string[]; lessonId?: string; courseId?: string },
  ) {
    return this.memoryService.createFlashcard(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post("flashcards/:id/review")
  reviewFlashcard(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("difficulty") difficulty: "FORGOT" | "HARD" | "GOOD" | "EASY",
  ) {
    return this.memoryService.reviewFlashcard(user.id, id, difficulty);
  }

  @UseGuards(JwtAuthGuard)
  @Get("flashcards/review-due")
  getReviewDue(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    return this.memoryService.getReviewDue(user.id, Number(limit ?? 10));
  }

  @UseGuards(JwtAuthGuard)
  @Get("revision/dashboard")
  getRevisionDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.memoryService.getRevisionDashboard(user.id);
  }
}
