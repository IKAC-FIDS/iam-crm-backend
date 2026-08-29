import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  KnowledgeBaseStatus,
  TechnicalConfidentiality,
  TechnicalDocumentStatus,
  TechnicalReleaseStatus,
  TechnicalResourceStatus,
  TechnicalResourceType,
  TechnicalVisibility,
  TenderRequirementStatus,
  TenderStatus,
  TenderType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { IsApiDateString } from '../../common/validators/api-date-string.validator';

export class TechnicalListDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() releaseId?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() opportunityId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsUUID() teamId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() @MaxLength(80) version?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsUUID() authorId?: string;
  @IsOptional() @IsBooleanString() reviewDue?: string;
  @IsOptional() @IsString() @MaxLength(40) sort?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection?: 'asc' | 'desc';
  @IsOptional() @IsApiDateString() from?: string;
  @IsOptional() @IsApiDateString() to?: string;
}

export class TechnicalDocumentListDto extends TechnicalListDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID() tenderId?: string;
  @ApiPropertyOptional({ enum: TechnicalConfidentiality })
  @IsOptional() @IsEnum(TechnicalConfidentiality) confidentiality?: TechnicalConfidentiality;
}

export class TransitionDto {
  @IsString() status!: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) revision?: number;
}

export class ReleaseTransitionDto extends TransitionDto {
  @IsEnum(TechnicalReleaseStatus) status!: TechnicalReleaseStatus;
}
export class KnowledgeTransitionDto extends TransitionDto {
  @IsEnum(KnowledgeBaseStatus) status!: KnowledgeBaseStatus;
}
export class DocumentTransitionDto extends TransitionDto {
  @IsEnum(TechnicalDocumentStatus) status!: TechnicalDocumentStatus;
}
export class TenderTransitionDto extends TransitionDto {
  @IsEnum(TenderStatus) status!: TenderStatus;
}

export class CreateReleaseDto {
  @IsUUID() productId!: string;
  @IsString() @Length(1, 80) version!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) summary?: string;
  @IsOptional() @IsString() releaseNotes?: string;
  @IsOptional() @IsApiDateString() releaseDate?: string;
  @IsOptional() @IsApiDateString() supportStartDate?: string;
  @IsOptional() @IsApiDateString() supportEndDate?: string;
  @IsOptional() @IsApiDateString() endOfLifeDate?: string;
}
export class UpdateReleaseDto extends PartialType(CreateReleaseDto) {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) revision?: number;
}

export class CreateKnowledgeDto {
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(1, 160) slug!: string;
  @IsString() @Length(1, 100000) content!: string;
  @IsOptional() @IsString() @MaxLength(1000) summary?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsEnum(TechnicalVisibility) visibility?: TechnicalVisibility;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() releaseId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsUUID() reviewerId?: string;
  @IsOptional() @IsApiDateString() nextReviewAt?: string;
}
export class UpdateKnowledgeDto extends PartialType(CreateKnowledgeDto) {}

export class CreateDocumentDto {
  @IsString() @Length(1, 200) title!: string;
  @IsString() @Length(1, 100) documentType!: string;
  @IsUUID() ownerId!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsEnum(TechnicalConfidentiality) confidentiality?: TechnicalConfidentiality;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() releaseId?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() opportunityId?: string;
  @IsOptional() @IsUUID() tenderId?: string;
  @IsOptional() @IsApiDateString() effectiveFrom?: string;
  @IsOptional() @IsApiDateString() expiresAt?: string;
}
export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) revision?: number;
}
export class CreateDocumentVersionDto {
  @IsString() @Length(1, 80) version!: string;
  @IsOptional() @IsUUID() attachmentId?: string;
  @IsOptional() @IsString() @MaxLength(128) contentHash?: string;
}

export class CreateResourceDto {
  @IsString() @Length(1, 200) title!: string;
  @IsEnum(TechnicalResourceType) resourceType!: TechnicalResourceType;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() releaseId?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) url?: string;
  @IsOptional() @IsString() @MaxLength(80) version?: string;
  @IsOptional() @IsString() @MaxLength(128) checksum?: string;
  @IsOptional() @IsUUID() ownerId?: string;
}
export class UpdateResourceDto extends PartialType(CreateResourceDto) {
  @IsOptional() @IsUUID() attachmentId?: string;
  @IsOptional() @IsEnum(TechnicalResourceStatus) status?: TechnicalResourceStatus;
}

export class CreateTenderDto {
  @IsString() @Length(1, 200) title!: string;
  @IsEnum(TenderType) tenderType!: TenderType;
  @IsUUID() ownerId!: string;
  @IsOptional() @IsString() @MaxLength(100) referenceNumber?: string;
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsUUID() opportunityId?: string;
  @IsOptional() @IsUUID() teamId?: string;
  @IsOptional() @IsString() @MaxLength(120) source?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsApiDateString() submissionDeadline?: string;
  @IsOptional() @IsApiDateString() technicalDeadline?: string;
  @IsOptional() @IsApiDateString() expectedDecisionDate?: string;
  @IsOptional() @IsNumberString() estimatedValue?: string;
  @IsOptional() @IsString() @Length(3, 3) currency?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) probability?: number;
  @IsOptional() @IsUUID() technicalLeadId?: string;
  @IsOptional() @IsUUID() commercialLeadId?: string;
}
export class UpdateTenderDto extends PartialType(CreateTenderDto) {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) revision?: number;
}

export class CreateRequirementDto {
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsBoolean() mandatory?: boolean;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsApiDateString() dueDate?: string;
  @IsOptional() @IsString() @MaxLength(20000) response?: string;
}
export class UpdateRequirementDto extends PartialType(CreateRequirementDto) {
  @IsOptional() @IsEnum(TenderRequirementStatus) status?: TenderRequirementStatus;
}

export class CreateDeliverableDto {
  @IsUUID() documentId!: string;
  @IsOptional() @IsString() @MaxLength(200) label?: string;
}

export const lifecycleEnums = {
  release: TechnicalReleaseStatus,
  knowledge: KnowledgeBaseStatus,
  document: TechnicalDocumentStatus,
  tender: TenderStatus,
};
