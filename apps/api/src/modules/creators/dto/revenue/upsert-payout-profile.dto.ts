import { PayoutMethod } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpsertPayoutProfileDto {
  @IsString()
  @MaxLength(120)
  legalName!: string;

  @IsString()
  @MaxLength(80)
  country!: string;

  @IsEnum(PayoutMethod)
  payoutMethod!: PayoutMethod;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  accountLast4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  upiId?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  paypalEmail?: string;
}
