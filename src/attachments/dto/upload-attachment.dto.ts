import { FileAttachmentEntityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadAttachmentDto {
  @IsEnum(FileAttachmentEntityType)
  entityType!: FileAttachmentEntityType;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @IsString()
  description?: string;
}