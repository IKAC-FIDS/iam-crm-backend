import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ActivityType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OwnershipScope } from '../../common/dto/ownership-scope.dto';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

const booleanValue = ({ value }: { value: unknown }) =>
  value === true || value === 'true'
    ? true
    : value === false || value === 'false'
      ? false
      : value;

export enum ActivityListStatus {
  RECORDED = 'RECORDED',
  COMPLETED = 'COMPLETED',
}

export class FindActivitiesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @IsOptional()
  @IsEnum(ActivityListStatus)
  status?: ActivityListStatus;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsUUID()
  createdById?: string;

  @IsOptional()
  @IsUUID()
  personId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsApiDateString()
  dateFrom?: string;

  @IsOptional()
  @IsApiDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(OwnershipScope)
  ownershipScope?: OwnershipScope;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  mine?: boolean;

  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  unassigned?: boolean;

  @IsOptional()
  @IsIn(['activityDate', 'createdAt'])
  sortBy?: 'activityDate' | 'createdAt' = 'activityDate';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
