import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { AdminService } from "./admin.service";
import { RejectCourseDto } from "./dto/reject-course.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("courses/pending")
  getPendingCourses() {
    return this.adminService.getPendingCourses();
  }

  @Get("courses/:id")
  getCourseReviewDetail(@Param("id") courseId: string) {
    return this.adminService.getCourseReviewDetail(courseId);
  }

  @Post("courses/:id/approve")
  approveCourse(@CurrentUser() user: AuthenticatedUser, @Param("id") courseId: string) {
    return this.adminService.approveCourse(user.id, courseId);
  }

  @Post("courses/:id/reject")
  rejectCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") courseId: string,
    @Body() payload: RejectCourseDto,
  ) {
    return this.adminService.rejectCourse(user.id, courseId, payload.reason);
  }
}
