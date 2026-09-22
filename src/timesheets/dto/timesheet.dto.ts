import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import {
  LeaveStatus,
  LeaveType,
  LeaveUnit,
  TimeEntryStatus,
  TimeEntryType,
} from "@prisma/client";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { IsApiDateString } from "../../common/validators/api-date-string.validator";

export class CreateTimesheetDto {
  @IsApiDateString() workDate!: string;
  @IsEnum(TimeEntryType) type!: TimeEntryType;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  endMinute?: number;
  @IsOptional() spansMidnight?: boolean;
  @ValidateIf((o) => o.startMinute == null && o.endMinute == null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2880)
  durationMinutes?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1440) breakMinutes =
    0;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsUUID() taskId?: string;
  @IsOptional() @IsUUID() companyId?: string;
}

export class UpdateTimesheetDto extends CreateTimesheetDto {}

export class FindMyTimesheetsDto extends PaginationDto {
  @IsOptional() @IsApiDateString() startDate?: string;
  @IsOptional() @IsApiDateString() endDate?: string;
  @IsOptional() @IsEnum(TimeEntryType) type?: TimeEntryType;
  @IsOptional() @IsEnum(TimeEntryStatus) status?: TimeEntryStatus;
  @IsOptional() sort?: "asc" | "desc" = "desc";
}

export class FindAdminTimesheetsDto extends FindMyTimesheetsDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() teamId?: string;
}

export class CreateLeaveRequestDto {
  @IsEnum(LeaveType) type!: LeaveType;
  @IsEnum(LeaveUnit) unit!: LeaveUnit;
  @IsApiDateString() startDate!: string;
  @IsApiDateString() endDate!: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  endMinute?: number;
  @IsOptional() @IsString() @MaxLength(4000) reason?: string;
}

export class UpdateLeaveRequestDto extends CreateLeaveRequestDto {}

export class FindMyLeaveRequestsDto extends PaginationDto {
  @IsOptional() @IsApiDateString() startDate?: string;
  @IsOptional() @IsApiDateString() endDate?: string;
  @IsOptional() @IsEnum(LeaveType) type?: LeaveType;
  @IsOptional() @IsEnum(LeaveStatus) status?: LeaveStatus;
  @IsOptional() sort?: "asc" | "desc" = "desc";
}

export class FindAdminLeaveRequestsDto extends FindMyLeaveRequestsDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() @IsUUID() teamId?: string;
}

export class RejectDecisionDto {
  @IsString() @MaxLength(2000) reason!: string;
}
