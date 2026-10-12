import { CustomerRequestAvailabilityPolicy, CustomerRequestStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class RequestTypeListDto {
  @IsOptional() @IsBoolean() @Transform(({ value }) => value === true || value === 'true') includeRetired?: boolean;
}
export class CreateRequestTypeDto {
  @IsString() @Length(2, 64) code!: string;
  @IsString() @Length(1, 160) displayName!: string;
  @IsOptional() @IsString() @Length(0, 2000) description?: string;
  @IsOptional() @IsObject() presentation?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) @Max(100000) displayOrder?: number;
  @IsOptional() @IsEnum(CustomerRequestAvailabilityPolicy) availabilityPolicy?: CustomerRequestAvailabilityPolicy;
}
export class UpdateRequestTypeDto {
  @IsOptional() @IsString() @Length(1, 160) displayName?: string;
  @IsOptional() @IsString() @Length(0, 2000) description?: string;
  @IsOptional() @IsObject() presentation?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) @Max(100000) displayOrder?: number;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsBoolean() retired?: boolean;
  @IsOptional() @IsEnum(CustomerRequestAvailabilityPolicy) availabilityPolicy?: CustomerRequestAvailabilityPolicy;
}
export class ConfigureAvailabilityDto { @IsArray() @IsUUID('4', { each: true }) companyIds!: string[] }
export class FormSchemaDto { @IsObject() schema!: Record<string, unknown> }
export class CreatePortalRequestDto {
  @IsUUID() requestTypeId!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsObject() answers?: Record<string, unknown>;
}
export class UpdateDraftDto {
  @IsOptional() @IsString() @Length(1, 200) title?: string;
  @IsObject() answers!: Record<string, unknown>;
}
export class RequestListDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsEnum(CustomerRequestStatus) status?: CustomerRequestStatus;
  @IsOptional() @IsUUID() requestTypeId?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() @Length(1, 120) search?: string;
  @IsOptional() @IsString() submittedFrom?: string;
  @IsOptional() @IsString() submittedTo?: string;
}
export class UpdateRequestStatusDto {
  @IsEnum(CustomerRequestStatus) status!: CustomerRequestStatus;
  @IsOptional() @IsString() @Length(0, 2000) customerVisibleExplanation?: string;
  @IsOptional() @IsString() @Length(0, 2000) internalReason?: string;
}
export class ShareRequestDto { @IsUUID() membershipId!: string }
