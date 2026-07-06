import { Type } from 'class-transformer';
import { PipelineStage, Priority } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOpportunityDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

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
}
