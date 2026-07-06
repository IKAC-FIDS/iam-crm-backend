// src/companies/dto/find-companies.dto.ts

import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PipelineStage, Priority } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindCompaniesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

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
}