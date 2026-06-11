import { BetaWaitlistRoleInterest } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class SubmitBetaWaitlistDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsEnum(BetaWaitlistRoleInterest)
  roleInterest!: BetaWaitlistRoleInterest;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  source?: string;
}
