import { Transform } from 'class-transformer';
import { ActivityType, PipelineStage, Priority } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

const csv = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const values = (Array.isArray(value) ? value : String(value).split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);
  return values.length ? values : undefined;
};

export class ReportFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ownerIds?: string[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  companyIds?: string[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teams?: string[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsEnum(PipelineStage, { each: true })
  stages?: PipelineStage[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsEnum(Priority, { each: true })
  priorities?: Priority[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];

  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsEnum(ActivityType, { each: true })
  activityTypes?: ActivityType[];
}
