import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CreatorsService } from "./creators.service";
import { UpsertCreatorProfileDto } from "./dto/upsert-creator-profile.dto";

@UseGuards(JwtAuthGuard)
@Controller("creators")
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post("apply")
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertCreatorProfileDto) {
    return this.creatorsService.apply(user.id, dto);
  }

  @Get("me")
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorsService.getMe(user.id);
  }

  @Patch("me")
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertCreatorProfileDto) {
    return this.creatorsService.updateMe(user.id, dto);
  }

  @Get("dashboard")
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorsService.getDashboard(user.id);
  }

  @Get("courses")
  getCourses(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorsService.getCourses(user.id);
  }
}
