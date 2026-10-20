"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const collaboration_access_service_1 = require("./collaboration-access.service");
let CollaborationService = class CollaborationService {
    constructor(prisma, access, audit) {
        this.prisma = prisma;
        this.access = access;
        this.audit = audit;
    }
    async listTopics(user, category) {
        this.requirePermission(user, 'collaboration:view');
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        return this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            const topics = await tx.collaborationTopic.findMany({
                where: { organizationId, archivedAt: null, ...(category ? { category } : {}), channels: { some: { archivedAt: null, OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId: user.userId } } }] } } },
                include: { channels: { where: { archivedAt: null, OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId: user.userId } } }] }, include: { members: { where: { userId: user.userId }, select: { role: true } }, _count: { select: { members: true } } }, orderBy: { createdAt: 'asc' } } },
                orderBy: { updatedAt: 'desc' },
            });
            const channelIds = topics.flatMap((topic) => topic.channels.map((channel) => channel.id));
            const unread = await this.unreadByChannel(tx, organizationId, user.userId, channelIds);
            return { data: topics.map((topic) => ({ ...topic, channels: topic.channels.map((channel) => this.presentChannel(channel, unread.get(channel.id) ?? 0)), unreadCount: topic.channels.reduce((sum, channel) => sum + (unread.get(channel.id) ?? 0), 0) })), totalUnreadCount: [...unread.values()].reduce((sum, value) => sum + value, 0) };
        });
    }
    async createTopic(dto, user) {
        this.requirePermission(user, 'collaboration:topic:create');
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const name = dto.name.trim();
        try {
            const topic = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationTopic.create({
                data: { organizationId, name, description: dto.description?.trim() || null, category: dto.category, createdById: user.userId, channels: { create: { organizationId, name: 'عمومی', visibility: 'PUBLIC', createdById: user.userId, members: { create: { userId: user.userId, role: 'OWNER', addedById: user.userId } } } } },
                include: { channels: { include: { members: true } } },
            }));
            await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-topic', entityId: topic.id, action: 'collaboration.topic_created', after: topic });
            return topic;
        }
        catch (error) {
            this.rethrowUnique(error, 'موضوعی با این نام وجود دارد');
        }
    }
    async getTopic(id, user) {
        this.requirePermission(user, 'collaboration:view');
        const result = await this.listTopics(user);
        const topic = result.data.find((item) => item.id === id);
        if (!topic)
            throw new common_1.NotFoundException('موضوع یافت نشد');
        return topic;
    }
    async updateTopic(id, dto, user) {
        this.requirePermission(user, 'collaboration:topic:update');
        await this.assertTopicExists(id, user);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const updated = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationTopic.update({ where: { id }, data: { ...(dto.name && { name: dto.name.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() || null }), ...(dto.category && { category: dto.category }) } }));
        await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-topic', entityId: id, action: 'collaboration.topic_updated', after: updated });
        return updated;
    }
    async archiveTopic(id, user) {
        this.requirePermission(user, 'collaboration:topic:delete');
        await this.assertTopicExists(id, user);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const archivedAt = new Date();
        await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationTopic.update({ where: { id }, data: { archivedAt, channels: { updateMany: { where: {}, data: { archivedAt } } } } }));
        await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-topic', entityId: id, action: 'collaboration.topic_archived' });
        return { id, archivedAt };
    }
    async createChannel(topicId, dto, user) {
        this.requirePermission(user, 'collaboration:channel:create');
        await this.assertTopicExists(topicId, user);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const memberIds = [...new Set([user.userId, ...(dto.initialMemberIds ?? [])])];
        await this.assertActiveUsers(memberIds, organizationId, user);
        try {
            const channel = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannel.create({ data: { organizationId, topicId, name: dto.name.trim(), description: dto.description?.trim() || null, visibility: dto.visibility, createdById: user.userId, members: { create: memberIds.map((userId) => ({ userId, role: userId === user.userId ? client_1.CollaborationChannelMemberRole.OWNER : client_1.CollaborationChannelMemberRole.MEMBER, addedById: user.userId })) } }, include: { members: true } }));
            await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: channel.id, action: 'collaboration.channel_created', after: channel });
            return channel;
        }
        catch (error) {
            this.rethrowUnique(error, 'کانالی با این نام وجود دارد');
        }
    }
    async getChannel(id, user) {
        this.requirePermission(user, 'collaboration:view');
        const channel = await this.access.assertReadable(id, user);
        if (channel.visibility === 'PUBLIC' && !channel.members.length)
            await this.joinPublicChannel(id, user);
        const members = await this.getMembers(id, user);
        const role = channel.members[0]?.role ?? (channel.visibility === 'PUBLIC' ? 'MEMBER' : null);
        return { ...channel, currentUserRole: role, memberCount: members.data.length, capabilities: { canManage: this.hasPermission(user, 'collaboration:channel:update') || this.hasPermission(user, 'collaboration:channel:delete'), canPost: true, canManageMembers: this.hasPermission(user, 'collaboration:member:manage') } };
    }
    async updateChannel(id, dto, user) {
        this.requirePermission(user, 'collaboration:channel:update');
        await this.access.assertReadable(id, user);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const updated = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannel.update({ where: { id }, data: { ...(dto.name && { name: dto.name.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() || null }), ...(dto.visibility && { visibility: dto.visibility }) } }));
        await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.channel_updated', after: updated });
        return updated;
    }
    async archiveChannel(id, user) { this.requirePermission(user, 'collaboration:channel:delete'); await this.access.assertReadable(id, user); const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); const archivedAt = new Date(); await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannel.update({ where: { id }, data: { archivedAt } })); await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.channel_archived' }); return { id, archivedAt }; }
    async joinPublicChannel(id, user) { this.requirePermission(user, 'collaboration:view'); const channel = await this.access.assertReadable(id, user); if (channel.visibility !== client_1.CollaborationChannelVisibility.PUBLIC)
        throw new common_1.NotFoundException('کانال یافت نشد'); return this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannelMember.upsert({ where: { channelId_userId: { channelId: id, userId: user.userId } }, create: { channelId: id, userId: user.userId, role: 'MEMBER', addedById: user.userId }, update: {} })); }
    async getMembers(id, user) { this.requirePermission(user, 'collaboration:view'); await this.access.assertReadable(id, user); const rows = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannelMember.findMany({ where: { channelId: id }, include: { user: { select: { id: true, fullName: true, email: true, avatarObjectKey: true, team: true, lastSeenAt: true, isActive: true } } }, orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }] })); return { data: rows.map((row) => ({ ...row, presence: this.presence(row.user.lastSeenAt) })) }; }
    async addMember(id, dto, user) { this.requirePermission(user, 'collaboration:member:manage'); await this.access.assertReadable(id, user); const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); await this.assertActiveUsers([dto.userId], organizationId, user); try {
        const member = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannelMember.create({ data: { channelId: id, userId: dto.userId, role: dto.role, addedById: user.userId } }));
        await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.member_added', metadata: { userId: dto.userId, role: dto.role } });
        return member;
    }
    catch (error) {
        this.rethrowUnique(error, 'کاربر قبلاً عضو کانال است');
    } }
    async removeMember(id, memberId, user) { this.requirePermission(user, 'collaboration:member:manage'); await this.access.assertReadable(id, user); const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); const member = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannelMember.findUnique({ where: { channelId_userId: { channelId: id, userId: memberId } } })); if (!member)
        throw new common_1.NotFoundException('عضو یافت نشد'); if (member.role === 'OWNER') {
        const owners = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannelMember.count({ where: { channelId: id, role: 'OWNER' } }));
        if (owners <= 1)
            throw new common_1.BadRequestException('آخرین مالک کانال قابل حذف نیست');
    } await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationChannelMember.delete({ where: { channelId_userId: { channelId: id, userId: memberId } } })); await this.audit.recordTenantEvent({ actorId: user.userId, organizationId, entityType: 'collaboration-channel', entityId: id, action: 'collaboration.member_removed', metadata: { userId: memberId } }); return { channelId: id, userId: memberId }; }
    async heartbeat(user) { this.requirePermission(user, 'collaboration:view'); const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); const lastSeenAt = new Date(); await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.user.updateMany({ where: { id: user.userId, organizationId, isActive: true }, data: { lastSeenAt } })); return { lastSeenAt, status: 'ONLINE' }; }
    async assertTopicExists(id, user) { const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); const topic = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.collaborationTopic.findFirst({ where: { id, organizationId, archivedAt: null }, select: { id: true } })); if (!topic)
        throw new common_1.NotFoundException('موضوع یافت نشد'); return topic; }
    async assertActiveUsers(ids, organizationId, user) { const count = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.user.count({ where: { id: { in: ids }, organizationId, isActive: true } })); if (count !== ids.length)
        throw new common_1.BadRequestException('یک یا چند کاربر عضو فعال این سازمان نیستند'); }
    hasPermission(user, permission) { return Boolean(user.tenantContext?.permissions.includes(permission)); }
    requirePermission(user, permission) { if (!this.hasPermission(user, permission))
        throw new common_1.ForbiddenException(`شما دسترسی لازم برای این عملیات را ندارید: ${permission}`); }
    presence(lastSeenAt) { if (!lastSeenAt)
        return 'OFFLINE'; const age = Date.now() - lastSeenAt.getTime(); return age <= 120000 ? 'ONLINE' : age <= 600000 ? 'AWAY' : 'OFFLINE'; }
    presentChannel(channel, unreadCount) { return { ...channel, currentUserRole: channel.members[0]?.role ?? null, memberCount: channel._count?.members ?? 0, unreadCount, members: undefined, _count: undefined }; }
    async unreadByChannel(tx, organizationId, userId, channelIds) { if (!channelIds.length)
        return new Map(); const rows = await tx.$queryRaw(client_1.Prisma.sql `SELECT t."entityId" AS "channelId", COUNT(m.id)::int AS count FROM "conversation_threads" t JOIN "conversation_messages" m ON m."threadId" = t.id AND m."deletedAt" IS NULL AND m."authorId" IS DISTINCT FROM ${userId} LEFT JOIN "conversation_participants" p ON p."threadId" = t.id AND p."userId" = ${userId} WHERE t."organizationId" = ${organizationId} AND t."entityType" = ${client_1.ConversationEntityType.COLLABORATION_CHANNEL}::"ConversationEntityType" AND t."entityId" IN (${client_1.Prisma.join(channelIds)}) AND (p."lastReadAt" IS NULL OR m."createdAt" > p."lastReadAt") GROUP BY t."entityId"`); return new Map(rows.map((row) => [row.channelId, Number(row.count)])); }
    rethrowUnique(error, message) { if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new common_1.ConflictException(message); throw error; }
};
exports.CollaborationService = CollaborationService;
exports.CollaborationService = CollaborationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, collaboration_access_service_1.CollaborationAccessService, audit_log_service_1.AuditLogService])
], CollaborationService);
//# sourceMappingURL=collaboration.service.js.map