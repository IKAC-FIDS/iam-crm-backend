import { IsBoolean, IsHexColor, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStageConfigDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isTerminal?: boolean;
}
