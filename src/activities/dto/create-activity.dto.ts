import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

export class CreateActivityDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  personId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

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
