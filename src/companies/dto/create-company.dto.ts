import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyOwnership, Priority } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEnum(CompanyOwnership)
  ownership?: CompanyOwnership;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  headOfficeCity?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
