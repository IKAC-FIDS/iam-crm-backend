import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  personId?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsDateString()
  nextActionDate?: string;
}
