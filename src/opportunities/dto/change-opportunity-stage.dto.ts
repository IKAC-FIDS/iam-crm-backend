import { PipelineStage } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ChangeOpportunityStageDto {
  @IsEnum(PipelineStage)
  stage!: PipelineStage;

  @IsOptional()
  @IsString()
  note?: string;
}
