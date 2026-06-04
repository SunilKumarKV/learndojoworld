import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectPayoutRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  notes!: string;
}
