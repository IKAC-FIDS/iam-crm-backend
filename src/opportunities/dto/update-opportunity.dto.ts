import { Type } from 'class-transformer';
import { Priority } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  lostReason?: string;
}
