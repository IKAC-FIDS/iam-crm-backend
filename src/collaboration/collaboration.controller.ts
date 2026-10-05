import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CollaborationService } from './collaboration.service';
import { AddCollaborationChannelMemberDto, CreateCollaborationChannelDto, CreateCollaborationTopicDto, UpdateCollaborationChannelDto, UpdateCollaborationTopicDto } from './dto/collaboration.dto';

@Controller('collaboration')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollaborationController {
  constructor(private readonly collaboration: CollaborationService) {}

  @Get('topics') listTopics(@CurrentUser() user: CurrentUserPayload) { return this.collaboration.listTopics(user); }
  @Post('topics') createTopic(@Body() dto: CreateCollaborationTopicDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.createTopic(dto, user); }
  @Get('topics/:topicId') getTopic(@Param('topicId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.getTopic(id, user); }
  @Patch('topics/:topicId') updateTopic(@Param('topicId') id: string, @Body() dto: UpdateCollaborationTopicDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.updateTopic(id, dto, user); }
  @Delete('topics/:topicId') archiveTopic(@Param('topicId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.archiveTopic(id, user); }
  @Post('topics/:topicId/channels') createChannel(@Param('topicId') id: string, @Body() dto: CreateCollaborationChannelDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.createChannel(id, dto, user); }
  @Get('channels/:channelId') getChannel(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.getChannel(id, user); }
  @Patch('channels/:channelId') updateChannel(@Param('channelId') id: string, @Body() dto: UpdateCollaborationChannelDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.updateChannel(id, dto, user); }
  @Delete('channels/:channelId') archiveChannel(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.archiveChannel(id, user); }
  @Post('channels/:channelId/join') joinChannel(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.joinPublicChannel(id, user); }
  @Get('channels/:channelId/members') getMembers(@Param('channelId') id: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.getMembers(id, user); }
  @Post('channels/:channelId/members') addMember(@Param('channelId') id: string, @Body() dto: AddCollaborationChannelMemberDto, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.addMember(id, dto, user); }
  @Delete('channels/:channelId/members/:userId') removeMember(@Param('channelId') id: string, @Param('userId') memberId: string, @CurrentUser() user: CurrentUserPayload) { return this.collaboration.removeMember(id, memberId, user); }
  @Post('presence/heartbeat') heartbeat(@CurrentUser() user: CurrentUserPayload) { return this.collaboration.heartbeat(user); }
}
