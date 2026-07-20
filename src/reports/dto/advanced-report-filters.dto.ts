import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { MeetingMode, MeetingStatus, TaskStatus } from "@prisma/client";
import { ReportFiltersDto } from "./report-filters.dto";
const csv = ({ value }: { value: unknown }) =>
  value == null || value === ""
    ? undefined
    : (Array.isArray(value) ? value : String(value).split(","))
        .map(String)
        .map((v) => v.trim())
        .filter(Boolean);
export class AdvancedReportFiltersDto extends ReportFiltersDto {
  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsEnum(MeetingStatus, { each: true })
  meetingStatuses?: MeetingStatus[];
  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsEnum(MeetingMode, { each: true })
  meetingModes?: MeetingMode[];
  @Transform(csv)
  @IsOptional()
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  taskStatuses?: TaskStatus[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
  @IsOptional() @IsString() trend?: string;
}
