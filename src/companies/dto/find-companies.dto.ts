// src/companies/dto/find-companies.dto.ts

import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { LegacyPipelineStage, Priority } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindCompaniesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(LegacyPipelineStage)
  stage?: LegacyPipelineStage;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsBooleanString()
  withoutOwner?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsBooleanString()
  includeArchived?: string;

  @IsOptional()
  @IsBooleanString()
  archivedOnly?: string;
}
