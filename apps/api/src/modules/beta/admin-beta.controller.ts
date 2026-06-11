import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { FeedbackStatus, SupportRequestStatus, UserRole } from "@prisma/client";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { BetaService } from "./beta.service";
import { CreateBetaAccessDto, UpdateBetaAccessDto } from "./dto/beta-access.dto";
import { CreateBetaCohortDto } from "./dto/cohort.dto";
import { UpdateFeedbackDto } from "./dto/feedback.dto";
import { UpdateSupportRequestDto } from "./dto/support-request.dto";

@Controller("admin/beta")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminBetaController {
  constructor(private readonly betaService: BetaService) {}

  @Get("dashboard")
  getDashboard() {
    return this.betaService.getBetaDashboard();
  }

  @Get("first-100")
  getFirst100Dashboard() {
    return this.betaService.getFirst100Dashboard();
  }

  @Get("access")
  listAccess() {
    return this.betaService.listBetaAccess();
  }

  @Post("access")
  createAccess(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBetaAccessDto) {
    return this.betaService.createBetaAccess(user.id, dto);
  }

  @Patch("access/:id")
  updateAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateBetaAccessDto,
  ) {
    return this.betaService.updateBetaAccess(user.id, id, dto);
  }

  @Get("waitlist")
  listWaitlist() {
    return this.betaService.listWaitlist();
  }

  @Post("waitlist/:id/invite")
  inviteWaitlist(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.betaService.inviteWaitlistEntry(user.id, id);
  }

  @Post("waitlist/:id/reject")
  rejectWaitlist(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.betaService.rejectWaitlistEntry(user.id, id);
  }

  @Get("cohorts")
  listCohorts() {
    return this.betaService.listCohorts();
  }

  @Post("cohorts")
  createCohort(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBetaCohortDto) {
    return this.betaService.createCohort(user.id, dto);
  }

  @Get("feedback")
  listFeedback(@Query("status") status?: FeedbackStatus) {
    return this.betaService.listFeedback(status);
  }

  @Patch("feedback/:id")
  updateFeedback(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.betaService.updateFeedback(user.id, id, dto);
  }

  @Get("support")
  listSupport(@Query("status") status?: SupportRequestStatus) {
    return this.betaService.listSupportRequests(status);
  }

  @Patch("support/:id")
  updateSupport(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateSupportRequestDto,
  ) {
    return this.betaService.updateSupportRequest(user.id, id, dto);
  }
}
