import { SupportRequestStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SubmitSupportRequestDto {
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;
}

export class UpdateSupportRequestDto {
  @IsOptional()
  @IsEnum(SupportRequestStatus)
  status?: SupportRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  adminNote?: string;
}
