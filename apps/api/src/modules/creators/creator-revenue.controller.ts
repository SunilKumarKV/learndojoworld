import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CreatorRevenueService } from "./creator-revenue.service";
import { CreatePayoutRequestDto } from "./dto/revenue/create-payout-request.dto";
import { UpsertPayoutProfileDto } from "./dto/revenue/upsert-payout-profile.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CREATOR)
@Controller("creator")
export class CreatorRevenueController {
  constructor(private readonly creatorRevenueService: CreatorRevenueService) {}

  @Get("revenue")
  getRevenue(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorRevenueService.getRevenue(user.id);
  }

  @Get("payout-profile")
  getPayoutProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorRevenueService.getPayoutProfile(user.id);
  }

  @Patch("payout-profile")
  upsertPayoutProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertPayoutProfileDto) {
    return this.creatorRevenueService.upsertPayoutProfile(user.id, dto);
  }

  @Post("payout-requests")
  createPayoutRequest(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePayoutRequestDto) {
    return this.creatorRevenueService.createPayoutRequest(user.id, dto);
  }

  @Get("payout-requests")
  getPayoutRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.creatorRevenueService.getPayoutRequests(user.id);
  }
}
