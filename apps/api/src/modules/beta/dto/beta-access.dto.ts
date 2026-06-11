import { BetaAccessStatus } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateBetaAccessDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;
}

export class UpdateBetaAccessDto {
  @IsOptional()
  @IsEnum(BetaAccessStatus)
  status?: BetaAccessStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  cohortId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  notes?: string;
}
