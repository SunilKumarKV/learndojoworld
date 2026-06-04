import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export enum AIInstruction {
  EXPLAIN_SIMPLE = "EXPLAIN_SIMPLE",
  REAL_EXAMPLE = "REAL_EXAMPLE",
  QUIZ_ME = "QUIZ_ME",
  SUMMARIZE = "SUMMARIZE",
  CREATE_FLASHCARDS = "CREATE_FLASHCARDS",
}

export class AIChatRequestDto {
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsEnum(AIInstruction)
  instruction?: AIInstruction;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;
}
