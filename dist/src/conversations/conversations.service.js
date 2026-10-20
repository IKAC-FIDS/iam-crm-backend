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
var ConversationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = exports.messageInclude = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const notification_core_service_1 = require("../notification-core/notification-core.service");
const prisma_service_1 = require("../prisma/prisma.service");
const conversation_access_service_1 = require("./conversation-access.service");
const attachments_service_1 = require("../attachments/attachments.service");
const crm_assistant_service_1 = require("../crm-assistant/crm-assistant.service");
exports.messageInclude = {
    author: { select: { id: true, fullName: true, avatarObjectKey: true } },
    parentMessage: { select: { id: true, body: true, type: true, author: { select: { id: true, fullName: true } } } },
    references: { select: { id: true, referenceType: true, referenceId: true, labelSnapshot: true } },
};
const referenceEntityTypes = {
    [client_1.ConversationMessageReferenceType.COMPANY]: client_1.ConversationEntityType.COMPANY,
    [client_1.ConversationMessageReferenceType.OPPORTUNITY]: client_1.ConversationEntityType.OPPORTUNITY,
    [client_1.ConversationMessageReferenceType.TASK]: client_1.ConversationEntityType.TASK,
    [client_1.ConversationMessageReferenceType.MEETING]: client_1.ConversationEntityType.MEETING,
};
let ConversationsService = ConversationsService_1 = class ConversationsService {
    constructor(prisma, access, notifications, audit, attachments, assistant) {
        this.prisma = prisma;
        this.access = access;
        this.notifications = notifications;
        this.audit = audit;
        this.attachments = attachments;
        this.assistant = assistant;
        this.logger = new common_1.Logger(ConversationsService_1.name);
    }
    async askBot(channelId, dto, user) {
        await this.access.assertReadable(client_1.ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
        const question = dto.body.trim().replace(/^\/bot(?:\s+|$)/i, '').trim();
        if (!question)
            throw new common_1.BadRequestException('پرسش دستیار الزامی است.');
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const requestKey = `${organizationId}:${channelId}:${user.userId}:${dto.requestId}`;
        let createdRequest = false;
        let requestMessage = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.findUnique({ where: { botRequestKey: requestKey }, include: exports.messageInclude }));
        if (!requestMessage) {
            try {
                requestMessage = await this.createMessage(client_1.ConversationEntityType.COLLABORATION_CHANNEL, channelId, {
                    body: question,
                    type: client_1.ConversationMessageType.COMMENT,
                    mentionedUserIds: dto.mentionedUserIds,
                    references: dto.references,
                    attachmentIds: dto.attachmentIds,
                }, user, requestKey);
                createdRequest = true;
            }
            catch (error) {
                requestMessage = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.findUnique({ where: { botRequestKey: requestKey }, include: exports.messageInclude }));
                if (!requestMessage)
                    throw error;
            }
        }
        if (!requestMessage)
            throw new common_1.ServiceUnavailableException('ثبت درخواست دستیار انجام نشد.');
        const existingResponse = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.findUnique({ where: { botResponseToId: requestMessage.id }, include: exports.messageInclude }));
        if (existingResponse)
            return { request: this.presentMessage(requestMessage), response: this.presentMessage(existingResponse) };
        if (!createdRequest && requestMessage.botStatus === 'PENDING')
            throw new common_1.ConflictException('این درخواست دستیار در حال پردازش است.');
        if (!createdRequest && requestMessage.botStatus === 'FAILED') {
            await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.update({ where: { id: requestMessage.id }, data: { botStatus: 'PENDING' } }));
        }
        const context = await this.buildBotContext(requestMessage.threadId, channelId, user);
        try {
            const result = await this.assistant.ask({ message: question }, user, {
                context,
                assertAccess: () => this.access.assertReadable(client_1.ConversationEntityType.COLLABORATION_CHANNEL, channelId, user),
            });
            await this.access.assertReadable(client_1.ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
            const response = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
                const created = await tx.conversationMessage.create({
                    data: { organizationId, threadId: requestMessage.threadId, authorId: null, senderType: 'ASSISTANT', body: result.answer, type: client_1.ConversationMessageType.COMMENT, botResponseToId: requestMessage.id },
                    include: exports.messageInclude,
                });
                await tx.conversationMessage.update({ where: { id: requestMessage.id }, data: { botStatus: 'COMPLETE' } });
                await tx.conversationParticipant.upsert({ where: { threadId_userId: { threadId: requestMessage.threadId, userId: user.userId } }, create: { threadId: requestMessage.threadId, userId: user.userId, lastReadAt: new Date() }, update: { lastReadAt: new Date() } });
                return created;
            });
            return { request: { ...this.presentMessage(requestMessage), botStatus: 'COMPLETE' }, response: this.presentMessage(response) };
        }
        catch (error) {
            await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.updateMany({ where: { id: requestMessage.id, organizationId, botStatus: 'PENDING' }, data: { botStatus: 'FAILED' } }));
            this.logger.error(`Collaboration bot failed request=${dto.requestId} channel=${channelId}`);
            if (error instanceof common_1.ForbiddenException || error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException || error instanceof common_1.BadGatewayException || error instanceof common_1.ServiceUnavailableException)
                throw error;
            throw new common_1.ServiceUnavailableException('دستیار CRM موقتاً پاسخ‌گو نیست؛ دوباره تلاش کنید.');
        }
    }
    async buildBotContext(threadId, channelId, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const channel = await this.access.assertReadable(client_1.ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
        const messages = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), (tx) => tx.conversationMessage.findMany({
            where: { threadId, organizationId, deletedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20,
            select: { id: true, body: true, senderType: true, createdAt: true, author: { select: { fullName: true } }, references: { select: { referenceType: true, referenceId: true } } },
        }));
        const referenceKeys = new Map();
        for (const message of messages)
            for (const reference of message.references)
                referenceKeys.set(`${reference.referenceType}:${reference.referenceId}`, { type: reference.referenceType, id: reference.referenceId });
        const references = [];
        for (const reference of [...referenceKeys.values()].slice(0, 12)) {
            try {
                references.push(await this.access.resolveAssistantReference(referenceEntityTypes[reference.type], reference.id, user));
            }
            catch (error) {
                if (!(error instanceof common_1.ForbiddenException || error instanceof common_1.NotFoundException))
                    throw error;
            }
        }
        return {
            channel: { id: channelId, name: channel.label },
            recentMessages: messages.reverse().map((message) => ({ role: message.senderType === 'ASSISTANT' ? 'assistant' : 'user', author: message.author?.fullName ?? 'دستیار CRM', content: message.body, createdAt: message.createdAt })),
            authorizedReferences: references,
            attachments: 'Attachment contents are not included.',
        };
    }
    async uploadChannelAttachment(channelId, file, user) {
        await this.access.assertReadable(client_1.ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
        return this.attachments.upload({ entityType: client_1.FileAttachmentEntityType.COLLABORATION_CHANNEL, entityId: channelId }, file, user);
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
                tx.conversationMessage.findMany({ where, include: exports.messageInclude, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }),
                tx.conversationMessage.count({ where }),
                tx.conversationMessage.count({ where: { ...where, OR: [{ authorId: { not: user.userId } }, { authorId: null }], deletedAt: null, ...(participant?.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {}) } }),
            ]);
            const presented = await this.withAttachments(tx, organizationId, messages.reverse().map(this.presentMessage));
            return { thread: { id: thread.id, status: thread.status, createdById: thread.createdById, createdAt: thread.createdAt, updatedAt: thread.updatedAt }, messages: presented, unreadCount, meta: this.meta(total, page, limit) };
        });
    }
    async findCompanyHub(companyId, user) {
        await this.access.assertReadable(client_1.ConversationEntityType.COMPANY, companyId, user);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const permissions = new Set(user.tenantContext?.permissions ?? []);
        const canViewTasks = permissions.has('task:view');
        const canViewActivities = permissions.has('activity:view');
        const canViewOrganizationActivities = user.role === 'ADMIN' || permissions.has('activity:view-organization');
        return this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            const [company, tasks, activities] = await Promise.all([
                tx.company.findFirst({ where: { id: companyId, organizationId, archivedAt: null }, select: { id: true, legalName: true, brandName: true } }),
                canViewTasks ? tx.task.findMany({
                    where: {
                        organizationId,
                        companyId,
                        ...(user.role === 'ADMIN' || permissions.has('task:view-organization') ? {} : {
                            OR: [{ assignedToId: user.userId }, { createdById: user.userId }, { reviewerId: user.userId }, { company: { ownerId: user.userId } }],
                        }),
                    },
                    select: { id: true, title: true },
                }) : Promise.resolve([]),
                canViewActivities ? tx.activity.findMany({
                    where: { companyId, ...(canViewOrganizationActivities ? {} : { userId: user.userId }) },
                    select: { id: true, type: true, notes: true },
                }) : Promise.resolve([]),
            ]);
            if (!company)
                throw new common_1.NotFoundException('Company not found');
            const taskLabels = new Map(tasks.map((item) => [item.id, item.title]));
            const activityLabels = new Map(activities.map((item) => [item.id, item.notes?.trim() || item.type]));
            const scopes = [
                { entityType: client_1.ConversationEntityType.COMPANY, entityId: companyId },
                ...(tasks.length ? [{ entityType: client_1.ConversationEntityType.TASK, entityId: { in: tasks.map((item) => item.id) } }] : []),
                ...(activities.length ? [{ entityType: client_1.ConversationEntityType.ACTIVITY, entityId: { in: activities.map((item) => item.id) } }] : []),
            ];
            const threads = await tx.conversationThread.findMany({
                where: { organizationId, OR: scopes },
                select: {
                    id: true, entityType: true, entityId: true, status: true, updatedAt: true,
                    participants: { where: { userId: user.userId }, select: { lastReadAt: true } },
                    messages: { where: { deletedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1, select: { id: true, body: true, type: true, createdAt: true, author: { select: { id: true, fullName: true, avatarObjectKey: true } } } },
                },
                orderBy: { updatedAt: 'desc' },
            });
            const threadIds = threads.map((item) => item.id);
            const unreadRows = threadIds.length ? await tx.$queryRaw(client_1.Prisma.sql `
        SELECT thread.id AS "threadId", COUNT(message.id)::int AS "unreadCount"
        FROM "conversation_threads" thread
        INNER JOIN "conversation_participants" participant ON participant."threadId" = thread.id AND participant."userId" = ${user.userId}
        INNER JOIN "conversation_messages" message ON message."threadId" = thread.id AND message."authorId" IS DISTINCT FROM ${user.userId} AND message."deletedAt" IS NULL
          AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
        WHERE thread."organizationId" = ${organizationId} AND thread.id IN (${client_1.Prisma.join(threadIds)})
        GROUP BY thread.id
      `) : [];
            const unread = new Map(unreadRows.map((item) => [item.threadId, Number(item.unreadCount)]));
            const data = threads.map((thread) => ({
                threadId: thread.id,
                entityType: thread.entityType,
                entityId: thread.entityId,
                entityLabel: thread.entityType === client_1.ConversationEntityType.COMPANY
                    ? (company.brandName || company.legalName)
                    : thread.entityType === client_1.ConversationEntityType.TASK
                        ? taskLabels.get(thread.entityId)
                        : activityLabels.get(thread.entityId),
                status: thread.status,
                updatedAt: thread.updatedAt,
                unreadCount: unread.get(thread.id) ?? 0,
                latestMessage: thread.messages[0] ?? null,
            }));
            return {
                company: { id: company.id, name: company.brandName || company.legalName },
                direct: data.find((item) => item.entityType === client_1.ConversationEntityType.COMPANY) ?? null,
                threads: data,
                counts: {
                    all: data.length,
                    company: data.filter((item) => item.entityType === client_1.ConversationEntityType.COMPANY).length,
                    tasks: data.filter((item) => item.entityType === client_1.ConversationEntityType.TASK).length,
                    activities: data.filter((item) => item.entityType === client_1.ConversationEntityType.ACTIVITY).length,
                    unread: data.reduce((sum, item) => sum + item.unreadCount, 0),
                },
            };
        });
    }
    async createMessage(entityType, entityId, dto, user, botRequestKey) {
        this.assertEntityType(entityType);
        const entity = await this.access.assertReadable(entityType, entityId, user);
        const body = dto.body.trim();
        if (!body && !dto.attachmentIds?.length)
            throw new common_1.BadRequestException('متن پیام یا پیوست الزامی است.');
        if (dto.type === client_1.ConversationMessageType.ANSWER && !dto.parentMessageId)
            throw new common_1.BadRequestException('پاسخ باید به یک پیام مرتبط باشد.');
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const references = await this.resolveReferences(dto.references ?? [], user);
        const created = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            const thread = await tx.conversationThread.upsert({
                where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } },
                create: { organizationId, entityType, entityId, createdById: user.userId },
                update: {},
            });
            let parent = null;
            if (dto.parentMessageId) {
                parent = await tx.conversationMessage.findFirst({ where: { id: dto.parentMessageId, threadId: thread.id, organizationId, deletedAt: null }, select: { id: true, authorId: true, parentMessageId: true } });
                if (!parent)
                    throw new common_1.BadRequestException('پیام مرجع نامعتبر است.');
            }
            const requestedMentionIds = [...new Set(dto.mentionedUserIds ?? [])].filter((id) => id !== user.userId);
            const mentionableUsers = requestedMentionIds.length
                ? await tx.user.findMany({
                    where: { id: { in: requestedMentionIds }, organizationId, isActive: true, ...(entityType === client_1.ConversationEntityType.COLLABORATION_CHANNEL ? { collaborationMemberships: { some: { channelId: entityId } } } : {}) },
                    select: { id: true },
                })
                : [];
            if (mentionableUsers.length !== requestedMentionIds.length) {
                throw new common_1.BadRequestException('یک یا چند کاربر منشن‌شده معتبر یا فعال نیستند.');
            }
            const mentionedUserIds = mentionableUsers.map((item) => item.id);
            const message = await tx.conversationMessage.create({
                data: { organizationId, threadId: thread.id, authorId: user.userId, ...(botRequestKey ? { botRequestKey, botStatus: 'PENDING' } : {}), body, type: dto.parentMessageId ? client_1.ConversationMessageType.ANSWER : dto.type, parentMessageId: parent?.id, references: { create: references.map((reference) => ({ organizationId, referenceType: reference.type, referenceId: reference.id, labelSnapshot: reference.label })) } },
                include: exports.messageInclude,
            });
            if (dto.attachmentIds?.length) {
                if (entityType !== client_1.ConversationEntityType.COLLABORATION_CHANNEL)
                    throw new common_1.BadRequestException('پیوست پیام فقط در کانال همکاری پشتیبانی می‌شود.');
                const attachments = await tx.fileAttachment.findMany({ where: { id: { in: dto.attachmentIds }, organizationId, entityType: client_1.FileAttachmentEntityType.COLLABORATION_CHANNEL, entityId, deletedAt: null, uploadedById: user.userId }, select: { id: true } });
                if (attachments.length !== new Set(dto.attachmentIds).size)
                    throw new common_1.BadRequestException('یک یا چند پیوست معتبر یا قابل دسترس نیستند.');
                await tx.artifactLink.createMany({ data: attachments.map((attachment) => ({ organizationId, artifactId: attachment.id, entityType: client_1.FileAttachmentEntityType.CONVERSATION_MESSAGE, entityId: message.id, createdById: user.userId })), skipDuplicates: true });
            }
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
        if (current.message.senderType === 'ASSISTANT' || current.message.botStatus)
            throw new common_1.BadRequestException('پیام دستیار یا درخواست آن قابل ویرایش نیست.');
        if (current.message.deletedAt)
            throw new common_1.BadRequestException('پیام حذف‌شده قابل ویرایش نیست.');
        const references = dto.references ? await this.resolveReferences(dto.references, user) : undefined;
        const updated = await this.prisma.withTenantTransaction(tenant_scope_util_1.tenantScope.require(user), async (tx) => {
            if (references) {
                await tx.conversationMessageReference.deleteMany({ where: { messageId, organizationId: current.message.organizationId } });
                await tx.conversationMessageReference.createMany({ data: references.map((reference) => ({ organizationId: current.message.organizationId, messageId, referenceType: reference.type, referenceId: reference.id, labelSnapshot: reference.label })) });
            }
            return tx.conversationMessage.update({ where: { id: messageId }, data: { body, editedAt: new Date() }, include: exports.messageInclude });
        });
        await this.audit.record({ actorId: user.userId, organizationId: current.message.organizationId, entityType: 'conversation-message', entityId: messageId, action: 'conversation.message_edited' });
        return this.presentMessage(updated);
    }
    async deleteMessage(messageId, user) {
        const current = await this.getMessageWithAccess(messageId, user);
        if (current.message.senderType === 'ASSISTANT' || current.message.botStatus)
            throw new common_1.BadRequestException('پیام دستیار یا درخواست آن قابل حذف نیست.');
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
    async resolveReferences(input, user) {
        const unique = [...new Map(input.map((item) => [`${item.type}:${item.id}`, item])).values()];
        return Promise.all(unique.map(async (item) => { const access = await this.access.assertReadable(referenceEntityTypes[item.type], item.id, user); return { ...item, label: access.label }; }));
    }
    async withAttachments(tx, organizationId, messages) {
        if (!messages.length)
            return messages;
        if (!tx.artifactLink)
            return messages.map((message) => ({ ...message, attachments: [] }));
        const links = await tx.artifactLink.findMany({ where: { organizationId, entityType: client_1.FileAttachmentEntityType.CONVERSATION_MESSAGE, entityId: { in: messages.map((message) => message.id) }, artifact: { deletedAt: null } }, include: { artifact: { select: { id: true, name: true, originalFileName: true, mimeType: true, sizeBytes: true } } } });
        const byMessage = new Map();
        for (const link of links)
            byMessage.set(link.entityId, [...(byMessage.get(link.entityId) ?? []), link.artifact]);
        return messages.map((message) => ({ ...message, attachments: byMessage.get(message.id) ?? [] }));
    }
    assertEntityType(value) { if (!Object.values(client_1.ConversationEntityType).includes(value))
        throw new common_1.BadRequestException('نوع موجودیت گفتگو نامعتبر است.'); }
    presentMessage(message) { return { ...message, body: message.deletedAt ? null : message.body, deletedById: undefined }; }
    meta(total, page, limit) { const totalPages = Math.ceil(total / limit); return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 }; }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = ConversationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        conversation_access_service_1.ConversationAccessService,
        notification_core_service_1.NotificationCoreService,
        audit_log_service_1.AuditLogService,
        attachments_service_1.AttachmentsService,
        crm_assistant_service_1.CrmAssistantService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map