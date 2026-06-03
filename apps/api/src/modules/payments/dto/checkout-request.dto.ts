import { IsEnum, IsString } from "class-validator";

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

  @IsString()
  courseId!: string;

  @IsEnum(PaymentGateway)
  gateway!: PaymentGateway;
}
