import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CollaborationChannelMemberRole, CollaborationChannelVisibility, ConversationEntityType, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId, tenantScope } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { CollaborationAccessService } from './collaboration-access.service';
import { AddCollaborationChannelMemberDto, CreateCollaborationChannelDto, CreateCollaborationTopicDto, UpdateCollaborationChannelDto, UpdateCollaborationTopicDto } from './dto/collaboration.dto';

@Injectable()
export class CollaborationService {
  constructor(private readonly prisma: PrismaService, private readonly access: CollaborationAccessService, private readonly audit: AuditLogService) {}

  async listTopics(user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    return this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
      const topics = await tx.collaborationTopic.findMany({
        where: { organizationId, archivedAt: null, channels: { some: { archivedAt: null, OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId: user.userId } } }] } } },
        include: { channels: { where: { archivedAt: null, OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId: user.userId } } }] }, include: { members: { where: { userId: user.userId }, select: { role: true } }, _count: { select: { members: true } } }, orderBy: { createdAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
      });
      const channelIds = topics.flatMap((topic) => topic.channels.map((channel) => channel.id));
      const unread = await this.unreadByChannel(tx, organizationId, user.userId, channelIds);
      return { data: topics.map((topic) => ({ ...topic, channels: topic.channels.map((channel) => this.presentChannel(channel, unread.get(channel.id) ?? 0)), unreadCount: topic.channels.reduce((sum, channel) => sum + (unread.get(channel.id) ?? 0), 0) })), totalUnreadCount: [...unread.values()].reduce((sum, value) => sum + value, 0) };
    });
  }

  async createTopic(dto: CreateCollaborationTopicDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const name = dto.name.trim();
    try {
      const topic = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationTopic.create({
        data: { organizationId, name, description: dto.description?.trim() || null, createdById: user.userId, channels: { create: { organizationId, name: 'عمومی', visibility: 'PUBLIC', createdById: user.userId, members: { create: { userId: user.userId, role: 'OWNER', addedById: user.userId } } } } },
        include: { channels: { include: { members: true } } },
      }));
      await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-topic', entityId: topic.id, action: 'collaboration.topic_created', after: topic });
      return topic;
    } catch (error) { this.rethrowUnique(error, 'موضوعی با این نام وجود دارد'); }
  }

  async getTopic(id: string, user: CurrentUserPayload) {
    const result = await this.listTopics(user);
    const topic = result.data.find((item) => item.id === id);
    if (!topic) throw new NotFoundException('موضوع یافت نشد');
    return topic;
  }

  async updateTopic(id: string, dto: UpdateCollaborationTopicDto, user: CurrentUserPayload) {
    await this.assertTopicManager(id, user);
    const organizationId = getCurrentOrganizationId(user);
    const updated = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationTopic.update({ where: { id }, data: { ...(dto.name && { name: dto.name.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() || null }) } }));
    await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-topic', entityId: id, action: 'collaboration.topic_updated', after: updated });
    return updated;
  }

  async archiveTopic(id: string, user: CurrentUserPayload) {
    await this.assertTopicManager(id, user); const organizationId = getCurrentOrganizationId(user); const archivedAt = new Date();
    await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationTopic.update({ where: { id }, data: { archivedAt, channels: { updateMany: { where: {}, data: { archivedAt } } } } }));
    await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-topic', entityId: id, action: 'collaboration.topic_archived' });
    return { id, archivedAt };
  }

  async createChannel(topicId: string, dto: CreateCollaborationChannelDto, user: CurrentUserPayload) {
    await this.assertTopicManager(topicId, user); const organizationId = getCurrentOrganizationId(user);
    const memberIds = [...new Set([user.userId, ...(dto.initialMemberIds ?? [])])];
    await this.assertActiveUsers(memberIds, organizationId, user);
    try {
      const channel = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannel.create({ data: { organizationId, topicId, name: dto.name.trim(), description: dto.description?.trim() || null, visibility: dto.visibility, createdById: user.userId, members: { create: memberIds.map((userId) => ({ userId, role: userId === user.userId ? CollaborationChannelMemberRole.OWNER : CollaborationChannelMemberRole.MEMBER, addedById: user.userId })) } }, include: { members: true } }));
      await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: channel.id, action: 'collaboration.channel_created', after: channel });
      return channel;
    } catch (error) { this.rethrowUnique(error, 'کانالی با این نام وجود دارد'); }
  }

  async getChannel(id: string, user: CurrentUserPayload) {
    const channel = await this.access.assertReadable(id, user);
    if (channel.visibility === 'PUBLIC' && !channel.members.length) await this.joinPublicChannel(id, user);
    const members = await this.getMembers(id, user);
    const role = channel.members[0]?.role ?? (channel.visibility === 'PUBLIC' ? 'MEMBER' : null);
    return { ...channel, currentUserRole: role, memberCount: members.data.length, capabilities: { canManage: this.isGlobalManager(user) || role === 'OWNER' || role === 'ADMIN', canPost: true, canManageMembers: this.isGlobalManager(user) || role === 'OWNER' || role === 'ADMIN' } };
  }

  async updateChannel(id: string, dto: UpdateCollaborationChannelDto, user: CurrentUserPayload) {
    await this.assertChannelManager(id, user); const organizationId = getCurrentOrganizationId(user);
    const updated = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannel.update({ where: { id }, data: { ...(dto.name && { name: dto.name.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() || null }), ...(dto.visibility && { visibility: dto.visibility }) } }));
    await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.channel_updated', after: updated }); return updated;
  }

  async archiveChannel(id: string, user: CurrentUserPayload) { await this.assertChannelManager(id, user); const organizationId = getCurrentOrganizationId(user); const archivedAt = new Date(); await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannel.update({ where: { id }, data: { archivedAt } })); await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.channel_archived' }); return { id, archivedAt }; }

  async joinPublicChannel(id: string, user: CurrentUserPayload) { const channel = await this.access.assertReadable(id, user); if (channel.visibility !== CollaborationChannelVisibility.PUBLIC) throw new NotFoundException('کانال یافت نشد'); return this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannelMember.upsert({ where: { channelId_userId: { channelId: id, userId: user.userId } }, create: { channelId: id, userId: user.userId, role: 'MEMBER', addedById: user.userId }, update: {} })); }

  async getMembers(id: string, user: CurrentUserPayload) { await this.access.assertReadable(id, user); const rows = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannelMember.findMany({ where: { channelId: id }, include: { user: { select: { id: true, fullName: true, email: true, avatarObjectKey: true, team: true, lastSeenAt: true, isActive: true } } }, orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }] })); return { data: rows.map((row) => ({ ...row, presence: this.presence(row.user.lastSeenAt) })) }; }

  async addMember(id: string, dto: AddCollaborationChannelMemberDto, user: CurrentUserPayload) { await this.assertChannelManager(id, user); const organizationId = getCurrentOrganizationId(user); await this.assertActiveUsers([dto.userId], organizationId, user); try { const member = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannelMember.create({ data: { channelId: id, userId: dto.userId, role: dto.role, addedById: user.userId } })); await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.member_added', metadata: { userId: dto.userId, role: dto.role } }); return member; } catch (error) { this.rethrowUnique(error, 'کاربر قبلاً عضو کانال است'); } }

  async removeMember(id: string, memberId: string, user: CurrentUserPayload) { await this.assertChannelManager(id, user); const organizationId = getCurrentOrganizationId(user); const member = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannelMember.findUnique({ where: { channelId_userId: { channelId: id, userId: memberId } } })); if (!member) throw new NotFoundException('عضو یافت نشد'); if (member.role === 'OWNER') { const owners = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannelMember.count({ where: { channelId: id, role: 'OWNER' } })); if (owners <= 1) throw new BadRequestException('آخرین مالک کانال قابل حذف نیست'); } await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationChannelMember.delete({ where: { channelId_userId: { channelId: id, userId: memberId } } })); await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.member_removed', metadata: { userId: memberId } }); return { channelId: id, userId: memberId }; }

  async heartbeat(user: CurrentUserPayload) { const organizationId = getCurrentOrganizationId(user); const lastSeenAt = new Date(); await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.user.updateMany({ where: { id: user.userId, organizationId, isActive: true }, data: { lastSeenAt } })); return { lastSeenAt, status: 'ONLINE' }; }

  private async assertTopicManager(id: string, user: CurrentUserPayload) { const organizationId = getCurrentOrganizationId(user); const topic = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.collaborationTopic.findFirst({ where: { id, organizationId, archivedAt: null }, select: { id: true, createdById: true, channels: { where: { members: { some: { userId: user.userId, role: { in: ['OWNER', 'ADMIN'] } } } }, take: 1, select: { id: true } } } })); if (!topic) throw new NotFoundException('موضوع یافت نشد'); if (!this.isGlobalManager(user) && topic.createdById !== user.userId && !topic.channels.length) throw new ForbiddenException('اجازه مدیریت موضوع را ندارید'); return topic; }
  private async assertChannelManager(id: string, user: CurrentUserPayload) { const channel = await this.access.assertReadable(id, user); const role = channel.members[0]?.role; if (!this.isGlobalManager(user) && role !== 'OWNER' && role !== 'ADMIN') throw new ForbiddenException('اجازه مدیریت کانال را ندارید'); return channel; }
  private async assertActiveUsers(ids: string[], organizationId: string, user: CurrentUserPayload) { const count = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.user.count({ where: { id: { in: ids }, organizationId, isActive: true } })); if (count !== ids.length) throw new BadRequestException('یک یا چند کاربر عضو فعال این سازمان نیستند'); }
  private isGlobalManager(user: CurrentUserPayload) { return user.role === 'ADMIN' || user.role === 'MANAGER'; }
  private presence(lastSeenAt: Date | null) { if (!lastSeenAt) return 'OFFLINE'; const age = Date.now() - lastSeenAt.getTime(); return age <= 120000 ? 'ONLINE' : age <= 600000 ? 'AWAY' : 'OFFLINE'; }
  private presentChannel(channel: any, unreadCount: number) { return { ...channel, currentUserRole: channel.members[0]?.role ?? null, memberCount: channel._count?.members ?? 0, unreadCount, members: undefined, _count: undefined }; }
  private async unreadByChannel(tx: Prisma.TransactionClient, organizationId: string, userId: string, channelIds: string[]) { if (!channelIds.length) return new Map<string, number>(); const rows = await tx.$queryRaw<Array<{ channelId: string; count: number }>>(Prisma.sql`SELECT t."entityId" AS "channelId", COUNT(m.id)::int AS count FROM "conversation_threads" t JOIN "conversation_messages" m ON m."threadId" = t.id AND m."deletedAt" IS NULL AND m."authorId" IS DISTINCT FROM ${userId} LEFT JOIN "conversation_participants" p ON p."threadId" = t.id AND p."userId" = ${userId} WHERE t."organizationId" = ${organizationId} AND t."entityType" = ${ConversationEntityType.COLLABORATION_CHANNEL}::"ConversationEntityType" AND t."entityId" IN (${Prisma.join(channelIds)}) AND (p."lastReadAt" IS NULL OR m."createdAt" > p."lastReadAt") GROUP BY t."entityId"`); return new Map(rows.map((row) => [row.channelId, Number(row.count)])); }
  private rethrowUnique(error: unknown, message: string): never { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException(message); throw error; }
}
