import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class UpsertCreatorProfileDto {
  @IsString()
  @MaxLength(80)
  displayName!: string;

  @IsString()
  @MaxLength(800)
  bio!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  expertise!: string[];

  @IsOptional()
  @IsUrl()
  @MaxLength(240)
  websiteUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(240)
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(240)
  youtubeUrl?: string;
}
