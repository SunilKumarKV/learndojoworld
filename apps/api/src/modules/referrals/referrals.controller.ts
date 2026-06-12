import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { ApplyReferralDto } from "./dto/apply-referral.dto";

@Controller("referrals")
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get("me")
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.referralsService.getMe(user.id);
  }

  @Get("stats")
  async getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.referralsService.getStats(user.id);
  }

  @Post("apply")
  async applyReferral(@CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyReferralDto) {
    return this.referralsService.applyReferral(user.id, dto.code);
  }
}
