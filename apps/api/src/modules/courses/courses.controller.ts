import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CoursesService } from "./courses.service";

@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  getCourses(
    @Query("search") search?: string,
    @Query("difficulty") difficulty?: string,
    @Query("category") category?: string,
  ) {
    return this.coursesService.getCourses(search, difficulty, category);
  }

  @Get(":slug")
  getCourseBySlug(@Param("slug") slug: string) {
    return this.coursesService.getCourseBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":courseId/enrollment-status")
  getEnrollmentStatus(@CurrentUser() user: AuthenticatedUser, @Param("courseId") courseId: string) {
    return this.coursesService.getEnrollmentStatus(user.id, courseId);
  }
}
