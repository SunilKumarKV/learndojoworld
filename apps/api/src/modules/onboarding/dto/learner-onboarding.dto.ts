import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsString, Min } from "class-validator";

import { Difficulty } from "@prisma/client";

export class LearnerOnboardingDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  goals!: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  topics!: string[];

  @IsEnum(Difficulty)
  level!: Difficulty;

  @IsInt()
  @Min(1)
  dailyGoalMin!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  learningStyle!: string[];
}
