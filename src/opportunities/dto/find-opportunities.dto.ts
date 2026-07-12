import { Priority } from '@prisma/client';
import { IsBooleanString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

export class FindOpportunitiesDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsString() team?: string;
  @IsOptional() @IsString() stage?: string;
  @IsOptional() @IsUUID() stageId?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsUUID() sourceOptionId?: string;
  @IsOptional() @IsString() opportunitySource?: string;
  @IsOptional() @IsUUID() primaryContactId?: string;
  @IsOptional() @IsApiDateString() expectedCloseFrom?: string;
  @IsOptional() @IsApiDateString() expectedCloseTo?: string;
  @IsOptional() @IsBooleanString() includeArchived?: string;
  @IsOptional() @IsBooleanString() archivedOnly?: string;
}
