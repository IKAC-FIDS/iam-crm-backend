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
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const notification_core_service_1 = require("../notification-core/notification-core.service");
const prisma_service_1 = require("../prisma/prisma.service");
const conversation_access_service_1 = require("./conversation-access.service");
const messageInclude = {
    author: { select: { id: true, fullName: true, avatarObjectKey: true } },
    parentMessage: { select: { id: true, body: true, type: true, author: { select: { id: true, fullName: true } } } },
};
let ConversationsService = class ConversationsService {
    constructor(prisma, access, notifications, audit) {
        this.prisma = prisma;
        this.access = access;
        this.notifications = notifications;
        this.audit = audit;
    }
    async findMentionOptions(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const search = query.search?.trim();
        const data = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.user.findMany({
            where: {
                organizationId,
                isActive: true,
                id: { not: user.userId },
                ...(search
                    ? {
                        OR: [
                            { fullName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            select: { id: true, fullName: true, email: true },
            orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
            take: 25,
        }));
        return { data };
    }
    async find(entityType, entityId, query, user) {
        this.assertEntityType(entityType);
        await this.access.assertReadable(entityType, entityId, user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        return this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            const thread = await tx.conversationThread.findUnique({
                where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } },
                include: { participants: { where: { userId: user.userId }, select: { lastReadAt: true } } },
            });
            if (!thread)
                return { thread: null, messages: [], unreadCount: 0, meta: this.meta(0, page, limit) };
            const participant = thread.participants[0];
            const where = { threadId: thread.id, organizationId };
            const [messages, total, unreadCount] = await Promise.all([
                tx.conversationMessage.findMany({ where, include: messageInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
                tx.conversationMessage.count({ where }),
                tx.conversationMessage.count({ where: { ...where, authorId: { not: user.userId }, deletedAt: null, ...(participant?.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {}) } }),
            ]);
            return { thread: { id: thread.id, status: thread.status, createdById: thread.createdById, createdAt: thread.createdAt, updatedAt: thread.updatedAt }, messages: messages.map(this.presentMessage), unreadCount, meta: this.meta(total, page, limit) };
        });
    }
    async createMessage(entityType, entityId, dto, user) {
        this.assertEntityType(entityType);
        const entity = await this.access.assertReadable(entityType, entityId, user);
        const body = dto.body.trim();
        if (!body)
            throw new common_1.BadRequestException('متن پیام الزامی است.');
        if (dto.type === client_1.ConversationMessageType.ANSWER && !dto.parentMessageId)
            throw new common_1.BadRequestException('پاسخ باید به یک پیام مرتبط باشد.');
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const created = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            const thread = await tx.conversationThread.upsert({
                where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } },
                create: { organizationId, entityType, entityId, createdById: user.userId },
                update: {},
            });
            let parent = null;
            if (dto.parentMessageId) {
                parent = await tx.conversationMessage.findFirst({ where: { id: dto.parentMessageId, threadId: thread.id, organizationId, deletedAt: null }, select: { id: true, authorId: true, parentMessageId: true } });
                if (!parent || parent.parentMessageId)
                    throw new common_1.BadRequestException('پیام مرجع نامعتبر است.');
            }
            const requestedMentionIds = [...new Set(dto.mentionedUserIds ?? [])].filter((id) => id !== user.userId);
            const mentionableUsers = requestedMentionIds.length
                ? await tx.user.findMany({
                    where: { id: { in: requestedMentionIds }, organizationId, isActive: true },
                    select: { id: true },
                })
                : [];
            if (mentionableUsers.length !== requestedMentionIds.length) {
                throw new common_1.BadRequestException('یک یا چند کاربر منشن‌شده معتبر یا فعال نیستند.');
            }
            const mentionedUserIds = mentionableUsers.map((item) => item.id);
            const message = await tx.conversationMessage.create({
                data: { organizationId, threadId: thread.id, authorId: user.userId, body, type: dto.parentMessageId ? client_1.ConversationMessageType.ANSWER : dto.type, parentMessageId: parent?.id },
                include: messageInclude,
            });
            const participantIds = [...new Set([user.userId, ...entity.responsibleUserIds, parent?.authorId, ...mentionedUserIds].filter((id) => Boolean(id)))];
            await Promise.all(participantIds.map((userId) => tx.conversationParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId } }, create: { threadId: thread.id, userId, ...(userId === user.userId ? { lastReadAt: new Date() } : {}) }, update: userId === user.userId ? { lastReadAt: new Date() } : {} })));
            return { thread, message, participantIds, mentionedUserIds };
        });
        await this.audit.record({ actorId: user.userId, organizationId, entityType: 'conversation-message', entityId: created.message.id, action: 'conversation.message_created', metadata: { threadId: created.thread.id, entityType, entityId, messageType: created.message.type, mentionedUserIds: created.mentionedUserIds } });
        const recipientIds = created.participantIds.filter((id) => id !== user.userId);
        const eventName = created.message.parentMessageId ? 'CONVERSATION.REPLY_CREATED' : dto.type === client_1.ConversationMessageType.QUESTION ? 'CONVERSATION.QUESTION_CREATED' : 'CONVERSATION.MESSAGE_CREATED';
        await this.notifications.publishDomainEvent({
            organizationId, eventName, aggregateType: entityType, aggregateId: entityId, actorId: user.userId,
            idempotencyKey: `conversation:${created.message.id}:created`,
            payload: { threadId: created.thread.id, messageId: created.message.id, entityType, entityId, messageType: created.message.type, parentMessageId: created.message.parentMessageId, mentionedUserIds: created.mentionedUserIds, assigneeUserIds: recipientIds, ownerUserId: recipientIds[0], creatorUserId: recipientIds[0], actionUrl: entity.actionUrl, entityLabel: entity.label },
        });
        return this.presentMessage(created.message);
    }
    async markRead(entityType, entityId, user) {
        this.assertEntityType(entityType);
        await this.access.assertReadable(entityType, entityId, user);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        return this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            const thread = await tx.conversationThread.findUnique({ where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } }, select: { id: true } });
            if (!thread)
                return { unreadCount: 0, lastReadAt: null };
            const lastReadAt = new Date();
            await tx.conversationParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId: user.userId } }, create: { threadId: thread.id, userId: user.userId, lastReadAt }, update: { lastReadAt } });
            return { unreadCount: 0, lastReadAt };
        });
    }
    async updateMessage(messageId, dto, user) {
        const body = dto.body.trim();
        if (!body)
            throw new common_1.BadRequestException('متن پیام الزامی است.');
        const current = await this.getMessageWithAccess(messageId, user);
        if (current.message.authorId !== user.userId && !this.canModerate(user))
            throw new common_1.ForbiddenException('اجازه ویرایش این پیام را ندارید.');
        if (current.message.deletedAt)
            throw new common_1.BadRequestException('پیام حذف‌شده قابل ویرایش نیست.');
        const updated = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.update({ where: { id: messageId }, data: { body, editedAt: new Date() }, include: messageInclude }));
        await this.audit.record({ actorId: user.userId, organizationId: current.message.organizationId, entityType: 'conversation-message', entityId: messageId, action: 'conversation.message_edited' });
        return this.presentMessage(updated);
    }
    async deleteMessage(messageId, user) {
        const current = await this.getMessageWithAccess(messageId, user);
        if (current.message.authorId !== user.userId && !this.canModerate(user))
            throw new common_1.ForbiddenException('اجازه حذف این پیام را ندارید.');
        const deletedAt = new Date();
        await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.update({ where: { id: messageId }, data: { deletedAt, deletedById: user.userId } }));
        await this.audit.record({ actorId: user.userId, organizationId: current.message.organizationId, entityType: 'conversation-message', entityId: messageId, action: 'conversation.message_deleted' });
        return { id: messageId, deletedAt };
    }
    async updateStatus(threadId, dto, user) {
        const { thread, entity } = await this.getThreadWithAccess(threadId, user);
        if (thread.createdById !== user.userId && !this.canModerate(user))
            throw new common_1.ForbiddenException('اجازه تغییر وضعیت گفتگو را ندارید.');
        const updated = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationThread.update({ where: { id: threadId }, data: { status: dto.status } }));
        await this.audit.record({ actorId: user.userId, organizationId: thread.organizationId, entityType: 'conversation-thread', entityId: threadId, action: `conversation.${dto.status.toLowerCase()}` });
        if (dto.status === 'RESOLVED') {
            const participantIds = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationParticipant.findMany({ where: { threadId }, select: { userId: true } }));
            const recipientIds = [...new Set([...participantIds.map((item) => item.userId), ...entity.responsibleUserIds])].filter((id) => id !== user.userId);
            await this.notifications.publishDomainEvent({ organizationId: thread.organizationId, eventName: 'CONVERSATION.RESOLVED', aggregateType: thread.entityType, aggregateId: thread.entityId, actorId: user.userId, idempotencyKey: `conversation:${threadId}:resolved:${updated.updatedAt.toISOString()}`, payload: { threadId, entityType: thread.entityType, entityId: thread.entityId, entityLabel: entity.label, assigneeUserIds: recipientIds, actionUrl: entity.actionUrl } });
        }
        return { id: updated.id, status: updated.status, updatedAt: updated.updatedAt };
    }
    async getMessageWithAccess(messageId, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const message = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.findFirst({ where: { id: messageId, organizationId }, include: { thread: true } }));
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        await this.access.assertReadable(message.thread.entityType, message.thread.entityId, user);
        return { message };
    }
    async getThreadWithAccess(threadId, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const thread = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationThread.findFirst({ where: { id: threadId, organizationId } }));
        if (!thread)
            throw new common_1.NotFoundException('Conversation not found');
        const entity = await this.access.assertReadable(thread.entityType, thread.entityId, user);
        return { thread, entity };
    }
    canModerate(user) { return user.role === 'ADMIN' || user.role === 'MANAGER'; }
    assertEntityType(value) { if (!Object.values(client_1.ConversationEntityType).includes(value))
        throw new common_1.BadRequestException('نوع موجودیت گفتگو نامعتبر است.'); }
    presentMessage(message) { return { ...message, body: message.deletedAt ? null : message.body, deletedById: undefined }; }
    meta(total, page, limit) { const totalPages = Math.ceil(total / limit); return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 }; }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        conversation_access_service_1.ConversationAccessService,
        notification_core_service_1.NotificationCoreService,
        audit_log_service_1.AuditLogService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map