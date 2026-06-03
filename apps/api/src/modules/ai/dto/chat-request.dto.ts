import { IsEnum, IsOptional, IsString } from "class-validator";

export enum AIInstruction {
  EXPLAIN_SIMPLE = "EXPLAIN_SIMPLE",
  REAL_EXAMPLE = "REAL_EXAMPLE",
  QUIZ_ME = "QUIZ_ME",
  SUMMARIZE = "SUMMARIZE",
  CREATE_FLASHCARDS = "CREATE_FLASHCARDS",
}

export class AIChatRequestDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsEnum(AIInstruction)
  instruction?: AIInstruction;

  @IsString()
  message!: string;
}
