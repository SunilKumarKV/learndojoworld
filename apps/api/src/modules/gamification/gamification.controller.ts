import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { GamificationService } from "./gamification.service";

@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get("summary")
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.gamificationService.getSummary(user.id);
  }
}
