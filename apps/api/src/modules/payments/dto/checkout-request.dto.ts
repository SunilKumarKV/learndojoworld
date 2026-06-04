import { IsEnum, IsUUID } from "class-validator";

export enum PaymentGateway {
  STRIPE = "stripe",
  RAZORPAY = "razorpay",
}

export enum CheckoutType {
  COURSE = "COURSE",
}

export class CheckoutRequestDto {
  @IsEnum(CheckoutType)
  type!: CheckoutType;

  @IsUUID()
  courseId!: string;

  @IsEnum(PaymentGateway)
  gateway!: PaymentGateway;
}
