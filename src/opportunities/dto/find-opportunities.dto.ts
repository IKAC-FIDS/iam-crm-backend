import { PipelineStage, Priority } from '@prisma/client';
import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindOpportunitiesDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsString() team?: string;
  @IsOptional() @IsEnum(PipelineStage) stage?: PipelineStage;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsBooleanString() includeArchived?: string;
  @IsOptional() @IsBooleanString() archivedOnly?: string;
}
