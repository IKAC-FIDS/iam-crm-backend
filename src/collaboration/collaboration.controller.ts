import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CollaborationService } from './collaboration.service';
import { AddCollaborationChannelMemberDto, CollaborationTopicsQueryDto, CreateCollaborationChannelDto, CreateCollaborationTopicDto, UpdateCollaborationChannelDto, UpdateCollaborationTopicDto } from './dto/collaboration.dto';

@Controller('collaboration')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollaborationController {
  constructor(private readonly collaboration: CollaborationService) {}

  @Get('topics') @Permissions('collaboration:view') listTopics(@Query() query: CollaborationTopicsQueryDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.listTopics(user, query.category); }
  @Post('topics') @Permissions('collaboration:topic:create') createTopic(@Body() dto: CreateCollaborationTopicDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.createTopic(dto, user); }
  @Get('topics/:topicId') @Permissions('collaboration:view') getTopic(@Param('topicId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.getTopic(id, user); }
  @Patch('topics/:topicId') @Permissions('collaboration:topic:update') updateTopic(@Param('topicId') id: string, @Body() dto: UpdateCollaborationTopicDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.updateTopic(id, dto, user); }
  @Delete('topics/:topicId') @Permissions('collaboration:topic:delete') archiveTopic(@Param('topicId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.archiveTopic(id, user); }
  @Post('topics/:topicId/channels') @Permissions('collaboration:channel:create') createChannel(@Param('topicId') id: string, @Body() dto: CreateCollaborationChannelDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.createChannel(id, dto, user); }
  @Get('channels/:channelId') @Permissions('collaboration:view') getChannel(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.getChannel(id, user); }
  @Patch('channels/:channelId') @Permissions('collaboration:channel:update') updateChannel(@Param('channelId') id: string, @Body() dto: UpdateCollaborationChannelDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.updateChannel(id, dto, user); }
  @Delete('channels/:channelId') @Permissions('collaboration:channel:delete') archiveChannel(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.archiveChannel(id, user); }
  @Post('channels/:channelId/join') @Permissions('collaboration:view') joinChannel(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.joinPublicChannel(id, user); }
  @Get('channels/:channelId/members') @Permissions('collaboration:view') getMembers(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.getMembers(id, user); }
  @Post('channels/:channelId/members') @Permissions('collaboration:member:manage') addMember(@Param('channelId') id: string, @Body() dto: AddCollaborationChannelMemberDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.addMember(id, dto, user); }
  @Delete('channels/:channelId/members/:userId') @Permissions('collaboration:member:manage') removeMember(@Param('channelId') id: string, @Param('userId') memberId: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.removeMember(id, memberId, user); }
  @Post('presence/heartbeat') @Permissions('collaboration:view') heartbeat(@CurrentUser() user: CurrentUserPayload) { return this.collaboration.heartbeat(user); }
}
