import { CustomerRequestAvailabilityPolicy, CustomerRequestCrmTargetType, CustomerRequestPriority, CustomerRequestRoutingDestination, CustomerRequestStatus, CustomerRequestTriageStatus, Priority, TechnicalConfidentiality } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

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
  @IsOptional() @IsEnum(CustomerRequestRoutingDestination) defaultRoutingDestination?: CustomerRequestRoutingDestination;
}
export class UpdateRequestTypeDto {
  @IsOptional() @IsString() @Length(1, 160) displayName?: string;
  @IsOptional() @IsString() @Length(0, 2000) description?: string;
  @IsOptional() @IsObject() presentation?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) @Max(100000) displayOrder?: number;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
  @IsOptional() @IsBoolean() retired?: boolean;
  @IsOptional() @IsEnum(CustomerRequestAvailabilityPolicy) availabilityPolicy?: CustomerRequestAvailabilityPolicy;
  @IsOptional() @IsEnum(CustomerRequestRoutingDestination) defaultRoutingDestination?: CustomerRequestRoutingDestination;
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
  @IsOptional() @IsEnum(CustomerRequestPriority) priority?: CustomerRequestPriority;
  @IsOptional() @IsEnum(CustomerRequestTriageStatus) triageStatus?: CustomerRequestTriageStatus;
  @IsOptional() @IsUUID() assignedToId?: string;
  @IsOptional() @IsUUID() responsibleTeamId?: string;
  @IsOptional() @IsEnum(CustomerRequestRoutingDestination) routingDestination?: CustomerRequestRoutingDestination;
  @IsOptional() @IsIn(['submittedAt', 'updatedAt']) sortBy?: 'submittedAt' | 'updatedAt';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
}
export class PortalRequestListDto {
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
export class UpdateRequestTriageDto {
  @Type(() => Number) @IsInt() @Min(1) expectedRevision!: number;
  @IsOptional() @IsEnum(CustomerRequestPriority) priority?: CustomerRequestPriority;
  @IsOptional() @IsUUID() assignedToId?: string | null;
  @IsOptional() @IsUUID() responsibleTeamId?: string | null;
  @IsOptional() @IsEnum(CustomerRequestRoutingDestination) routingDestination?: CustomerRequestRoutingDestination;
  @IsOptional() @IsString() @Length(0, 2000) internalReason?: string;
  @IsOptional() @IsBoolean() completeTriage?: boolean;
}
export class LinkCustomerRequestRecordDto { @IsEnum(CustomerRequestCrmTargetType) targetType!: CustomerRequestCrmTargetType; @IsUUID() targetId!: string; @IsOptional() @IsString() @Length(0, 500) purpose?: string }
export class UnlinkCustomerRequestRecordDto { @IsString() @Length(2, 1000) reason!: string }
export class CreateLinkedTaskDto { @IsString() @Length(1, 200) title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsEnum(Priority) priority?: Priority; @IsOptional() @IsString() dueAt?: string; @IsOptional() @IsUUID() assignedToId?: string; @IsOptional() @IsString() purpose?: string; @IsString() @Length(8, 120) idempotencyKey!: string }
export class CreateLinkedOpportunityDto { @IsString() @Length(1, 200) title!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsUUID() ownerId?: string; @IsOptional() @IsUUID() stageId?: string; @IsOptional() @IsEnum(Priority) priority?: Priority; @IsOptional() @IsString() expectedCloseDate?: string; @IsOptional() @IsString() purpose?: string; @IsString() @Length(8, 120) idempotencyKey!: string }
export class CreateLinkedTechnicalDocumentDto { @IsString() @Length(1, 200) title!: string; @IsString() @Length(1, 100) documentType!: string; @IsUUID() ownerId!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsEnum(TechnicalConfidentiality) confidentiality?: TechnicalConfidentiality; @IsOptional() @IsString() purpose?: string; @IsString() @Length(8, 120) idempotencyKey!: string }
