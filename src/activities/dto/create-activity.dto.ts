import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ActivityType } from '@prisma/client';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

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
  @IsApiDateString()
  occurredAt?: string;

  @IsOptional()
  @IsApiDateString()
  nextActionDate?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;
}
