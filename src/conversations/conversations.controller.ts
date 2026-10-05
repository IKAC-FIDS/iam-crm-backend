import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConversationEntityType } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AskConversationBotDto, CreateConversationMessageDto, FindConversationDto, FindConversationMentionOptionsDto, FindConversationReferenceOptionsDto, UpdateConversationMessageDto, UpdateConversationStatusDto } from './dto/conversation.dto';
import { ConversationsService } from './conversations.service';
import { ConversationReferenceOptionsService } from './conversation-reference-options.service';

@Controller('conversations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService, private readonly referenceOptions: ConversationReferenceOptionsService) {}

  @Get('mention-options')
  mentionOptions(@Query() query: FindConversationMentionOptionsDto, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.findMentionOptions(query, user);
  }
  @Get('reference-options') findReferenceOptions(@Query() query: FindConversationReferenceOptionsDto, @CurrentUser() user: CurrentUserPayload) { return this.referenceOptions.find(query, user); }

  @Get('company-hub/:companyId')
  companyHub(@Param('companyId') companyId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.findCompanyHub(companyId, user);
  }

  @Get(':entityType/:entityId')
  find(@Param('entityType') entityType: ConversationEntityType, @Param('entityId') entityId: string, @Query() query: FindConversationDto, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.find(entityType, entityId, query, user);
  }

  @Post(':entityType/:entityId/messages')
  createMessage(@Param('entityType') entityType: ConversationEntityType, @Param('entityId') entityId: string, @Body() dto: CreateConversationMessageDto, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.createMessage(entityType, entityId, dto, user);
  }

  @Post('COLLABORATION_CHANNEL/:entityId/bot')
  askBot(@Param('entityId') entityId: string, @Body() dto: AskConversationBotDto, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.askBot(entityId, dto, user);
  }

  @Post('COLLABORATION_CHANNEL/:entityId/attachments')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  uploadChannelAttachment(@Param('entityId') entityId: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.uploadChannelAttachment(entityId, file, user);
  }

  @Post(':entityType/:entityId/read')
  markRead(@Param('entityType') entityType: ConversationEntityType, @Param('entityId') entityId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.markRead(entityType, entityId, user);
  }

  @Patch('messages/:messageId')
  updateMessage(@Param('messageId') messageId: string, @Body() dto: UpdateConversationMessageDto, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.updateMessage(messageId, dto, user);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Param('messageId') messageId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.deleteMessage(messageId, user);
  }

  @Patch(':threadId/status')
  updateStatus(@Param('threadId') threadId: string, @Body() dto: UpdateConversationStatusDto, @CurrentUser() user: CurrentUserPayload) {
    return this.conversations.updateStatus(threadId, dto, user);
  }
}
