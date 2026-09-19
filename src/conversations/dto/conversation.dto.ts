import { ConversationMessageType, ConversationThreadStatus } from '@prisma/client';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindConversationDto extends PaginationDto {}

export class FindConversationMentionOptionsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreateConversationMessageDto {
  @IsString()
  @MinLength(1)
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
}

export class UpdateConversationMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;
}

export class UpdateConversationStatusDto {
  @IsEnum(ConversationThreadStatus)
  status!: ConversationThreadStatus;
}
