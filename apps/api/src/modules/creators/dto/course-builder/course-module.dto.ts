import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateCreatorModuleDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

export class UpdateCreatorModuleDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
