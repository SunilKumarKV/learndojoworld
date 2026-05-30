import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("events")
  trackEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { event: string; metadata?: Record<string, unknown> },
  ) {
    return this.analyticsService.trackEvent(user.id, body.event, body.metadata ?? {});
  }

  @UseGuards(JwtAuthGuard)
  @Get("founder")
  getFounderMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getFounderMetrics(user.id);
  }
}
