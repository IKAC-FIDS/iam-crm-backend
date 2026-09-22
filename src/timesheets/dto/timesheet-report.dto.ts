import { IsEnum, IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import { TimeEntryType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PersonalTimesheetReportDto extends PaginationDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) dateFrom!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) dateTo!: string;
}
export class TimesheetOptionsDto {
  @IsIn(['timesheet', 'leave']) domain: 'timesheet' | 'leave' = 'timesheet';
}
export class TimesheetReportDto extends PersonalTimesheetReportDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() teamId?: string;
  @IsOptional() @IsEnum(TimeEntryType) entryType?: TimeEntryType;
  @IsOptional() @IsIn(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']) status?: string;
  @IsOptional() @IsUUID() taskId?: string;
  @IsOptional() @IsUUID() companyId?: string;
}
