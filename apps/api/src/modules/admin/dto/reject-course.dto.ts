import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
