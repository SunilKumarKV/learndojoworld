import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class CreateBetaCohortDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(500)
  targetUsers!: number;
}
