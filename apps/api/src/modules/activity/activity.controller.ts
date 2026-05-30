import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { ActivityService } from "./activity.service";

@Controller("activity")
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @UseGuards(JwtAuthGuard)
  @Get("timeline")
  getTimeline(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit = "10") {
    return this.activityService.getTimeline(user.id, Number(limit));
  }
}
