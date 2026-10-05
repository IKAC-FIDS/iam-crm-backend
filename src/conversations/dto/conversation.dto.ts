import { ConversationMessageReferenceType, ConversationMessageType, ConversationThreadStatus } from '@prisma/client';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindConversationDto extends PaginationDto {}

export class FindConversationMentionOptionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
export class FindConversationReferenceOptionsDto {
  @IsEnum(ConversationMessageReferenceType) type!: ConversationMessageReferenceType;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
}

export class CreateConversationMessageDto {
  @IsString()
  @MaxLength(4000)
  body!: string;

  @IsEnum(ConversationMessageType)
  type: ConversationMessageType = ConversationMessageType.COMMENT;

  @IsOptional()
  @IsUUID()
  parentMessageId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ConversationReferenceDto)
  references?: ConversationReferenceDto[];

  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(10) @IsUUID('4', { each: true })
  attachmentIds?: string[];
}

export class ConversationReferenceDto {
  @IsEnum(ConversationMessageReferenceType) type!: ConversationMessageReferenceType;
  @IsUUID() id!: string;
}

export class AskConversationBotDto extends CreateConversationMessageDto {
  @IsUUID('4')
  requestId!: string;
}

export class UpdateConversationMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ConversationReferenceDto)
  references?: ConversationReferenceDto[];
}

export class UpdateConversationStatusDto {
  @IsEnum(ConversationThreadStatus)
  status!: ConversationThreadStatus;
}
