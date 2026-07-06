import { IsEnum } from 'class-validator';
import { PipelineStage } from '@prisma/client';

export class ChangeStageDto {
  @IsEnum(PipelineStage)
  stage: PipelineStage;
}
