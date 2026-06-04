import { IsInt, IsString, MaxLength, Min } from "class-validator";

export class CreatePayoutRequestDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @MaxLength(3)
  currency!: string;
}
