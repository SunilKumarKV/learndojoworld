import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import { CoursesService } from "./courses.service";

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly coursesService: CoursesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createEnrollment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnrollmentDto) {
    return this.coursesService.createEnrollment(user.id, dto.courseId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.getMyEnrollments(user.id);
  }
}
