import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectRewardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
