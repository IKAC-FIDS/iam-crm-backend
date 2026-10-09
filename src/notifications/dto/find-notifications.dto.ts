import {
  NotificationEntityType,
  NotificationPriority,
  NotificationType,
} from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum NotificationSortBy {
  CREATED_AT = 'createdAt',
  PRIORITY = 'priority',
}

export enum NotificationSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FindNotificationsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((item) => String(item).trim())
      .filter(Boolean),
  )
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  types?: NotificationType[];

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @Transform(({ value }) =>
    (Array.isArray(value) ? value : String(value).split(','))
      .map((item) => String(item).trim())
      .filter(Boolean),
  )
  @IsArray()
  @IsEnum(NotificationPriority, { each: true })
  priorities?: NotificationPriority[];

  @IsOptional()
  @IsEnum(NotificationEntityType)
  entityType?: NotificationEntityType;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsIn(['unread', 'read', 'all'])
  status?: 'unread' | 'read' | 'all';

  @IsOptional()
  @IsString()
  includeArchived?: 'true' | 'false';

  @IsOptional()
  @IsString()
  archivedOnly?: 'true' | 'false';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(NotificationSortBy)
  sortBy?: NotificationSortBy = NotificationSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(NotificationSortOrder)
  sortOrder?: NotificationSortOrder = NotificationSortOrder.DESC;
}
