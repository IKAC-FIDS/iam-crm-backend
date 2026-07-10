import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CompanyOwnership, Priority } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsUUID()
  industryId?: string;

  /**
   * Deprecated compatibility input.
   * Prefer industryId.
   * If sent, it must match an existing Industry.name.
   */
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
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  headOfficeCity?: string;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  /**
   * Deprecated compatibility input.
   * Prefer sourceId.
   * If sent, it must match an existing LeadSource.code or LeadSource.name.
   */
  @IsOptional()
  @IsString()
  source?: string;
}