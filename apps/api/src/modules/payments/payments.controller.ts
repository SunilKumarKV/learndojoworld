import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { CheckoutRequestDto } from "./dto/checkout-request.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getMyPayments(user.id);
  }

  @Post("checkout")
  @UseGuards(JwtAuthGuard)
  async createCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutRequestDto) {
    return this.paymentsService.createCheckoutSession(user.id, dto);
  }
}
