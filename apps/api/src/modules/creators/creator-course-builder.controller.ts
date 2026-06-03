import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CreatorCourseBuilderService } from "./creator-course-builder.service";
import {
  CreateCreatorCourseDto,
  UpdateCreatorCourseDto,
} from "./dto/course-builder/course-basic-info.dto";
import {
  CreateCreatorLessonDto,
  UpdateCreatorLessonDto,
} from "./dto/course-builder/course-lesson.dto";
import {
  CreateCreatorModuleDto,
  UpdateCreatorModuleDto,
} from "./dto/course-builder/course-module.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CREATOR)
@Controller("creator")
export class CreatorCourseBuilderController {
  constructor(private readonly builderService: CreatorCourseBuilderService) {}

  @Post("courses")
  createCourse(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCreatorCourseDto) {
    return this.builderService.createCourse(user.id, dto);
  }

  @Get("courses")
  listCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.builderService.listCourses(user.id);
  }

  @Get("courses/:id")
  getCourse(@CurrentUser() user: AuthenticatedUser, @Param("id") courseId: string) {
    return this.builderService.getCourse(user.id, courseId);
  }

  @Patch("courses/:id")
  updateCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") courseId: string,
    @Body() dto: UpdateCreatorCourseDto,
  ) {
    return this.builderService.updateCourse(user.id, courseId, dto);
  }

  @Delete("courses/:id")
  deleteCourse(@CurrentUser() user: AuthenticatedUser, @Param("id") courseId: string) {
    return this.builderService.deleteCourse(user.id, courseId);
  }

  @Post("courses/:courseId/modules")
  createModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("courseId") courseId: string,
    @Body() dto: CreateCreatorModuleDto,
  ) {
    return this.builderService.createModule(user.id, courseId, dto);
  }

  @Patch("modules/:moduleId")
  updateModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId") moduleId: string,
    @Body() dto: UpdateCreatorModuleDto,
  ) {
    return this.builderService.updateModule(user.id, moduleId, dto);
  }

  @Delete("modules/:moduleId")
  deleteModule(@CurrentUser() user: AuthenticatedUser, @Param("moduleId") moduleId: string) {
    return this.builderService.deleteModule(user.id, moduleId);
  }

  @Post("modules/:moduleId/lessons")
  createLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId") moduleId: string,
    @Body() dto: CreateCreatorLessonDto,
  ) {
    return this.builderService.createLesson(user.id, moduleId, dto);
  }

  @Patch("lessons/:lessonId")
  updateLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId") lessonId: string,
    @Body() dto: UpdateCreatorLessonDto,
  ) {
    return this.builderService.updateLesson(user.id, lessonId, dto);
  }

  @Delete("lessons/:lessonId")
  deleteLesson(@CurrentUser() user: AuthenticatedUser, @Param("lessonId") lessonId: string) {
    return this.builderService.deleteLesson(user.id, lessonId);
  }

  @Post("courses/:courseId/submit-review")
  submitForReview(@CurrentUser() user: AuthenticatedUser, @Param("courseId") courseId: string) {
    return this.builderService.submitForReview(user.id, courseId);
  }
}
