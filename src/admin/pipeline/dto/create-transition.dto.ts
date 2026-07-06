import { PipelineStage, UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class CreateTransitionDto {
  @IsOptional()
  @IsEnum(PipelineStage)
  fromStage?: PipelineStage | null;

  @IsEnum(PipelineStage)
  toStage!: PipelineStage;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole | null;

  @IsBoolean()
  isAllowed!: boolean;
}
