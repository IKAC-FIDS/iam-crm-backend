import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ActivityType } from '@prisma/client';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

const emptyStringToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsUUID()
  personId?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsApiDateString()
  occurredAt?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  notes?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsString()
  outcome?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsApiDateString()
  nextActionDate?: string | null;

  @Transform(emptyStringToNull)
  @IsOptional()
  @IsUUID()
  opportunityId?: string | null;
}
