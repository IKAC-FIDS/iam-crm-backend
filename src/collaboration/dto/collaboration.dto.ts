import { CollaborationChannelMemberRole, CollaborationChannelVisibility } from '@prisma/client';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCollaborationTopicDto {
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class UpdateCollaborationTopicDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class CreateCollaborationChannelDto {
  @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsEnum(CollaborationChannelVisibility) visibility!: CollaborationChannelVisibility;
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(100) @IsUUID('4', { each: true }) initialMemberIds?: string[];
}

export class UpdateCollaborationChannelDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsEnum(CollaborationChannelVisibility) visibility?: CollaborationChannelVisibility;
}

export class AddCollaborationChannelMemberDto {
  @IsUUID() userId!: string;
  @IsOptional() @IsEnum(CollaborationChannelMemberRole) role: CollaborationChannelMemberRole = CollaborationChannelMemberRole.MEMBER;
}
