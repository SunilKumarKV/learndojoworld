import { IsString, IsNotEmpty } from "class-validator";

export class RejectRewardDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
