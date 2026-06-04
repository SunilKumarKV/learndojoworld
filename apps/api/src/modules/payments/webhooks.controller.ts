import { Controller, Headers, Post, RawBodyRequest, Req } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Request } from "express";

import { PaymentsService } from "./payments.service";

@Controller("webhooks/payments")
@SkipThrottle()
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("stripe")
  async handleStripeWebhook(
    @Headers("stripe-signature") signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const body = req.rawBody?.toString("utf-8") || JSON.stringify(req.body);
    return this.paymentsService.handleStripeWebhook(signature, body);
  }

  @Post("razorpay")
  async handleRazorpayWebhook(
    @Headers("x-razorpay-signature") signature: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const body = req.rawBody?.toString("utf-8") || JSON.stringify(req.body);
    return this.paymentsService.handleRazorpayWebhook(signature, body);
  }
}
