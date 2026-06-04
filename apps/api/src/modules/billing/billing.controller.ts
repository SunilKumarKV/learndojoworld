import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { BillingService } from "./billing.service";
import { SubscribeDto } from "./dto/subscribe.dto";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plans")
  getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getBillingState(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("subscribe")
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribeDto) {
    return this.billingService.subscribe(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("cancel")
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.cancel(user.id);
  }
}
