import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ActivityType } from '@prisma/client';

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
  @IsDateString()
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
  @IsDateString()
  nextActionDate?: string | null;
}
