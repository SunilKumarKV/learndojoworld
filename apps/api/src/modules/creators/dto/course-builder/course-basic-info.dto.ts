import { Difficulty } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from "class-validator";

export class CreateCreatorCourseDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  subtitle?: string;

  @IsString()
  @MaxLength(2400)
  description!: string;

  @IsUUID()
  categoryId!: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsString()
  @MaxLength(40)
  language!: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  thumbnailUrl?: string;
}

export class UpdateCreatorCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2400)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  language?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  thumbnailUrl?: string;
}
