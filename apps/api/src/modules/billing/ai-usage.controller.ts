import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { BillingService } from "./billing.service";

@Controller("ai")
export class AIUsageController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Get("usage")
  getUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getAIUsage(user.id);
  }
}
