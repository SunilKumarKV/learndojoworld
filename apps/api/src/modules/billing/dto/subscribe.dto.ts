import { IsEnum } from "class-validator";

export enum BillingPlanCode {
  PRO = "PRO",
  PREMIUM = "PREMIUM",
}

export enum BillingInterval {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum BillingGateway {
  STRIPE = "stripe",
  RAZORPAY = "razorpay",
}

export class SubscribeDto {
  @IsEnum(BillingPlanCode)
  planCode!: BillingPlanCode;

  @IsEnum(BillingInterval)
  interval!: BillingInterval;

  @IsEnum(BillingGateway)
  gateway!: BillingGateway;
}
