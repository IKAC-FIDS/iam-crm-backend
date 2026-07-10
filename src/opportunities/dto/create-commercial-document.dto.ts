import {
  CommercialDocumentStatus,
  CommercialDocumentType,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommercialDocumentDto {
  @IsEnum(CommercialDocumentType)
  type!: CommercialDocumentType;

  @IsOptional()
  @IsEnum(CommercialDocumentStatus)
  status?: CommercialDocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  number?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  version?: number;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsOptional()
  @IsDateString()
  acceptedAt?: string;

  @IsOptional()
  @IsDateString()
  rejectedAt?: string;

  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  externalRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}