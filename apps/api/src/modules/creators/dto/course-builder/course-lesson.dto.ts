import { LessonType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateCreatorLessonDto {
  @IsString()
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsString()
  @MaxLength(20000)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateCreatorLessonDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  content?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
