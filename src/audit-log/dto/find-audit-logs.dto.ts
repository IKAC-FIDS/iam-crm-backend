import {
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

export class FindAuditLogsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  requestMethod?: string;

  @IsOptional()
  @IsString()
  requestPath?: string;

  @IsOptional()
  @IsApiDateString()
  startDate?: string;

  @IsOptional()
  @IsApiDateString()
  endDate?: string;
}
