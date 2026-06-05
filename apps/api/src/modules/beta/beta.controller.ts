import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { BetaService } from "./beta.service";
import { SubmitFeedbackDto } from "./dto/feedback.dto";
import { SubmitSupportRequestDto } from "./dto/support-request.dto";

@Controller("beta")
@UseGuards(JwtAuthGuard)
export class BetaController {
  constructor(private readonly betaService: BetaService) {}

  @Get("me")
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.betaService.getMyBetaAccess(user.id);
  }

  @Post("feedback")
  submitFeedback(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitFeedbackDto) {
    return this.betaService.submitFeedback(user.id, dto);
  }

  @Post("support")
  submitSupportRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitSupportRequestDto,
  ) {
    return this.betaService.submitSupportRequest(user.id, dto);
  }
}
