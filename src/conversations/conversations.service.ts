import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConversationEntityType, ConversationMessageReferenceType, ConversationMessageType, FileAttachmentEntityType, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId, tenantScope } from '../common/tenant/tenant-scope.util';
import { NotificationCoreService } from '../notification-core/notification-core.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationAccessService } from './conversation-access.service';
import { CreateConversationMessageDto, FindConversationDto, FindConversationMentionOptionsDto, UpdateConversationMessageDto, UpdateConversationStatusDto } from './dto/conversation.dto';
import { AttachmentsService } from '../attachments/attachments.service';
import { CrmAssistantService } from '../crm-assistant/crm-assistant.service';
import { AskConversationBotDto } from './dto/conversation.dto';

export const messageInclude = {
  author: { select: { id: true, fullName: true, avatarObjectKey: true } },
  parentMessage: { select: { id: true, body: true, type: true, author: { select: { id: true, fullName: true } } } },
  references: { select: { id: true, referenceType: true, referenceId: true, labelSnapshot: true } },
} satisfies Prisma.ConversationMessageInclude;

const referenceEntityTypes: Record<ConversationMessageReferenceType, ConversationEntityType> = {
  [ConversationMessageReferenceType.COMPANY]: ConversationEntityType.COMPANY,
  [ConversationMessageReferenceType.OPPORTUNITY]: ConversationEntityType.OPPORTUNITY,
  [ConversationMessageReferenceType.TASK]: ConversationEntityType.TASK,
  [ConversationMessageReferenceType.MEETING]: ConversationEntityType.MEETING,
};

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ConversationAccessService,
    private readonly notifications: NotificationCoreService,
    private readonly audit: AuditLogService,
    private readonly attachments: AttachmentsService,
    private readonly assistant: CrmAssistantService,
  ) {}

  async askBot(channelId: string, dto: AskConversationBotDto, user: CurrentUserPayload) {
    await this.access.assertReadable(ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
    const question = dto.body.trim().replace(/^\/bot(?:\s+|$)/i, '').trim();
    if (!question) throw new BadRequestException('پرسش دستیار الزامی است.');
    const organizationId = getCurrentOrganizationId(user);
    const requestKey = `${organizationId}:${channelId}:${user.userId}:${dto.requestId}`;
    let createdRequest = false;
    let requestMessage = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) =>
      tx.conversationMessage.findUnique({ where: { botRequestKey: requestKey }, include: messageInclude }),
    );
    if (!requestMessage) {
      try {
        requestMessage = await this.createMessage(ConversationEntityType.COLLABORATION_CHANNEL, channelId, {
          body: question,
          type: ConversationMessageType.COMMENT,
          mentionedUserIds: dto.mentionedUserIds,
          references: dto.references,
          attachmentIds: dto.attachmentIds,
        }, user, requestKey) as typeof requestMessage;
        createdRequest = true;
      } catch (error) {
        requestMessage = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) =>
          tx.conversationMessage.findUnique({ where: { botRequestKey: requestKey }, include: messageInclude }),
        );
        if (!requestMessage) throw error;
      }
    }
    if (!requestMessage) throw new ServiceUnavailableException('ثبت درخواست دستیار انجام نشد.');
    const existingResponse = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) =>
      tx.conversationMessage.findUnique({ where: { botResponseToId: requestMessage!.id }, include: messageInclude }),
    );
    if (existingResponse) return { request: this.presentMessage(requestMessage), response: this.presentMessage(existingResponse) };
    if (!createdRequest && requestMessage.botStatus === 'PENDING') throw new ConflictException('این درخواست دستیار در حال پردازش است.');
    if (!createdRequest && requestMessage.botStatus === 'FAILED') {
      await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationMessage.update({ where: { id: requestMessage!.id }, data: { botStatus: 'PENDING' } }));
    }

    const context = await this.buildBotContext(requestMessage.threadId, channelId, user);
    try {
      const result = await this.assistant.ask({ message: question }, user, {
        context,
        assertAccess: () => this.access.assertReadable(ConversationEntityType.COLLABORATION_CHANNEL, channelId, user),
      });
      await this.access.assertReadable(ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
      const response = await this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
        const created = await tx.conversationMessage.create({
          data: { organizationId, threadId: requestMessage!.threadId, authorId: null, senderType: 'ASSISTANT', body: result.answer, type: ConversationMessageType.COMMENT, botResponseToId: requestMessage!.id },
          include: messageInclude,
        });
        await tx.conversationMessage.update({ where: { id: requestMessage!.id }, data: { botStatus: 'COMPLETE' } });
        await tx.conversationParticipant.upsert({ where: { threadId_userId: { threadId: requestMessage!.threadId, userId: user.userId } }, create: { threadId: requestMessage!.threadId, userId: user.userId, lastReadAt: new Date() }, update: { lastReadAt: new Date() } });
        return created;
      });
      return { request: { ...this.presentMessage(requestMessage), botStatus: 'COMPLETE' }, response: this.presentMessage(response) };
    } catch (error) {
      await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationMessage.updateMany({ where: { id: requestMessage!.id, organizationId, botStatus: 'PENDING' }, data: { botStatus: 'FAILED' } }));
      this.logger.error(`Collaboration bot failed request=${dto.requestId} channel=${channelId}`);
      if (error instanceof ForbiddenException || error instanceof BadRequestException || error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('دستیار CRM موقتاً پاسخ‌گو نیست؛ دوباره تلاش کنید.');
    }
  }

  private async buildBotContext(threadId: string, channelId: string, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const channel = await this.access.assertReadable(ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
    const messages = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationMessage.findMany({
      where: { threadId, organizationId, deletedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20,
      select: { id: true, body: true, senderType: true, createdAt: true, author: { select: { fullName: true } }, references: { select: { referenceType: true, referenceId: true } } },
    }));
    const referenceKeys = new Map<string, { type: ConversationMessageReferenceType; id: string }>();
    for (const message of messages) for (const reference of message.references) referenceKeys.set(`${reference.referenceType}:${reference.referenceId}`, { type: reference.referenceType, id: reference.referenceId });
    const references: unknown[] = [];
    for (const reference of [...referenceKeys.values()].slice(0, 12)) {
      try {
        references.push(await this.access.resolveAssistantReference(referenceEntityTypes[reference.type], reference.id, user));
      } catch (error) {
        if (!(error instanceof ForbiddenException || error instanceof NotFoundException)) throw error;
      }
    }
    return {
      channel: { id: channelId, name: channel.label },
      recentMessages: messages.reverse().map((message) => ({ role: message.senderType === 'ASSISTANT' ? 'assistant' : 'user', author: message.author?.fullName ?? 'دستیار CRM', content: message.body, createdAt: message.createdAt })),
      authorizedReferences: references,
      attachments: 'Attachment contents are not included.',
    };
  }

  async uploadChannelAttachment(channelId: string, file: Express.Multer.File | undefined, user: CurrentUserPayload) {
    await this.access.assertReadable(ConversationEntityType.COLLABORATION_CHANNEL, channelId, user);
    return this.attachments.upload({ entityType: FileAttachmentEntityType.COLLABORATION_CHANNEL, entityId: channelId }, file, user);
  }

  async findMentionOptions(query: FindConversationMentionOptionsDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const search = query.search?.trim();
    const data = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) =>
      tx.user.findMany({
        where: {
          organizationId,
          isActive: true,
          id: { not: user.userId },
          ...(search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' as const } },
                  { email: { contains: search, mode: 'insensitive' as const } },
                ],
              }
            : {}),
        },
        select: { id: true, fullName: true, email: true },
        orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
        take: 25,
      }),
    );
    return { data };
  }

  async find(entityType: ConversationEntityType, entityId: string, query: FindConversationDto, user: CurrentUserPayload) {
    this.assertEntityType(entityType);
    await this.access.assertReadable(entityType, entityId, user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const organizationId = getCurrentOrganizationId(user);
    return this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
      const thread = await tx.conversationThread.findUnique({
        where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } },
        include: { participants: { where: { userId: user.userId }, select: { lastReadAt: true } } },
      });
      if (!thread) return { thread: null, messages: [], unreadCount: 0, meta: this.meta(0, page, limit) };
      const participant = thread.participants[0];
      const where = { threadId: thread.id, organizationId };
      const [messages, total, unreadCount] = await Promise.all([
        tx.conversationMessage.findMany({ where, include: messageInclude, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit }),
        tx.conversationMessage.count({ where }),
        tx.conversationMessage.count({ where: { ...where, OR: [{ authorId: { not: user.userId } }, { authorId: null }], deletedAt: null, ...(participant?.lastReadAt ? { createdAt: { gt: participant.lastReadAt } } : {}) } }),
      ]);
      const presented = await this.withAttachments(tx, organizationId, messages.reverse().map(this.presentMessage));
      return { thread: { id: thread.id, status: thread.status, createdById: thread.createdById, createdAt: thread.createdAt, updatedAt: thread.updatedAt }, messages: presented, unreadCount, meta: this.meta(total, page, limit) };
    });
  }

  async findCompanyHub(companyId: string, user: CurrentUserPayload) {
    await this.access.assertReadable(ConversationEntityType.COMPANY, companyId, user);
    const organizationId = getCurrentOrganizationId(user);
    const permissions = new Set(user.tenantContext?.permissions ?? []);
    const canViewTasks = permissions.has('task:view');
    const canViewActivities = permissions.has('activity:view');
    const canViewOrganizationActivities = user.role === 'ADMIN' || permissions.has('activity:view-organization');

    return this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
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
      if (!company) throw new NotFoundException('Company not found');
      const taskLabels = new Map<string, string>(tasks.map((item) => [item.id, item.title] as const));
      const activityLabels = new Map<string, string>(activities.map((item) => [item.id, item.notes?.trim() || item.type] as const));
      const scopes: Prisma.ConversationThreadWhereInput[] = [
        { entityType: ConversationEntityType.COMPANY, entityId: companyId },
        ...(tasks.length ? [{ entityType: ConversationEntityType.TASK, entityId: { in: tasks.map((item) => item.id) } } as Prisma.ConversationThreadWhereInput] : []),
        ...(activities.length ? [{ entityType: ConversationEntityType.ACTIVITY, entityId: { in: activities.map((item) => item.id) } } as Prisma.ConversationThreadWhereInput] : []),
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
      const unreadRows = threadIds.length ? await tx.$queryRaw<Array<{ threadId: string; unreadCount: number }>>(Prisma.sql`
        SELECT thread.id AS "threadId", COUNT(message.id)::int AS "unreadCount"
        FROM "conversation_threads" thread
        INNER JOIN "conversation_participants" participant ON participant."threadId" = thread.id AND participant."userId" = ${user.userId}
        INNER JOIN "conversation_messages" message ON message."threadId" = thread.id AND message."authorId" IS DISTINCT FROM ${user.userId} AND message."deletedAt" IS NULL
          AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
        WHERE thread."organizationId" = ${organizationId} AND thread.id IN (${Prisma.join(threadIds)})
        GROUP BY thread.id
      `) : [];
      const unread = new Map(unreadRows.map((item) => [item.threadId, Number(item.unreadCount)]));
      const data = threads.map((thread) => ({
        threadId: thread.id,
        entityType: thread.entityType,
        entityId: thread.entityId,
        entityLabel: thread.entityType === ConversationEntityType.COMPANY
          ? (company.brandName || company.legalName)
          : thread.entityType === ConversationEntityType.TASK
            ? taskLabels.get(thread.entityId)
            : activityLabels.get(thread.entityId),
        status: thread.status,
        updatedAt: thread.updatedAt,
        unreadCount: unread.get(thread.id) ?? 0,
        latestMessage: thread.messages[0] ?? null,
      }));
      return {
        company: { id: company.id, name: company.brandName || company.legalName },
        direct: data.find((item) => item.entityType === ConversationEntityType.COMPANY) ?? null,
        threads: data,
        counts: {
          all: data.length,
          company: data.filter((item) => item.entityType === ConversationEntityType.COMPANY).length,
          tasks: data.filter((item) => item.entityType === ConversationEntityType.TASK).length,
          activities: data.filter((item) => item.entityType === ConversationEntityType.ACTIVITY).length,
          unread: data.reduce((sum, item) => sum + item.unreadCount, 0),
        },
      };
    });
  }

  async createMessage(entityType: ConversationEntityType, entityId: string, dto: CreateConversationMessageDto, user: CurrentUserPayload, botRequestKey?: string) {
    this.assertEntityType(entityType);
    const entity = await this.access.assertReadable(entityType, entityId, user);
    const body = dto.body.trim();
    if (!body && !dto.attachmentIds?.length) throw new BadRequestException('متن پیام یا پیوست الزامی است.');
    if (dto.type === ConversationMessageType.ANSWER && !dto.parentMessageId) throw new BadRequestException('پاسخ باید به یک پیام مرتبط باشد.');
    const organizationId = getCurrentOrganizationId(user);
    const references = await this.resolveReferences(dto.references ?? [], user);
    const created = await this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
      const thread = await tx.conversationThread.upsert({
        where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } },
        create: { organizationId, entityType, entityId, createdById: user.userId },
        update: {},
      });
      let parent: { id: string; authorId: string | null; parentMessageId: string | null } | null = null;
      if (dto.parentMessageId) {
        parent = await tx.conversationMessage.findFirst({ where: { id: dto.parentMessageId, threadId: thread.id, organizationId, deletedAt: null }, select: { id: true, authorId: true, parentMessageId: true } });
        if (!parent || parent.parentMessageId) throw new BadRequestException('پیام مرجع نامعتبر است.');
      }
      const requestedMentionIds = [...new Set(dto.mentionedUserIds ?? [])].filter((id) => id !== user.userId);
      const mentionableUsers = requestedMentionIds.length
        ? await tx.user.findMany({
            where: { id: { in: requestedMentionIds }, organizationId, isActive: true, ...(entityType === ConversationEntityType.COLLABORATION_CHANNEL ? { collaborationMemberships: { some: { channelId: entityId } } } : {}) },
            select: { id: true },
          })
        : [];
      if (mentionableUsers.length !== requestedMentionIds.length) {
        throw new BadRequestException('یک یا چند کاربر منشن‌شده معتبر یا فعال نیستند.');
      }
      const mentionedUserIds = mentionableUsers.map((item) => item.id);
      const message = await tx.conversationMessage.create({
        data: { organizationId, threadId: thread.id, authorId: user.userId, ...(botRequestKey ? { botRequestKey, botStatus: 'PENDING' as const } : {}), body, type: dto.parentMessageId ? ConversationMessageType.ANSWER : dto.type, parentMessageId: parent?.id, references: { create: references.map((reference) => ({ organizationId, referenceType: reference.type, referenceId: reference.id, labelSnapshot: reference.label })) } },
        include: messageInclude,
      });
      if (dto.attachmentIds?.length) {
        if (entityType !== ConversationEntityType.COLLABORATION_CHANNEL) throw new BadRequestException('پیوست پیام فقط در کانال همکاری پشتیبانی می‌شود.');
        const attachments = await tx.fileAttachment.findMany({ where: { id: { in: dto.attachmentIds }, organizationId, entityType: FileAttachmentEntityType.COLLABORATION_CHANNEL, entityId, deletedAt: null, uploadedById: user.userId }, select: { id: true } });
        if (attachments.length !== new Set(dto.attachmentIds).size) throw new BadRequestException('یک یا چند پیوست معتبر یا قابل دسترس نیستند.');
        await tx.artifactLink.createMany({ data: attachments.map((attachment) => ({ organizationId, artifactId: attachment.id, entityType: FileAttachmentEntityType.CONVERSATION_MESSAGE, entityId: message.id, createdById: user.userId })), skipDuplicates: true });
      }
      const participantIds = [...new Set([user.userId, ...entity.responsibleUserIds, parent?.authorId, ...mentionedUserIds].filter((id): id is string => Boolean(id)))];
      await Promise.all(participantIds.map((userId) => tx.conversationParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId } }, create: { threadId: thread.id, userId, ...(userId === user.userId ? { lastReadAt: new Date() } : {}) }, update: userId === user.userId ? { lastReadAt: new Date() } : {} })));
      return { thread, message, participantIds, mentionedUserIds };
    });
    await this.audit.record({ actorId: user.userId, organizationId, entityType: 'conversation-message', entityId: created.message.id, action: 'conversation.message_created', metadata: { threadId: created.thread.id, entityType, entityId, messageType: created.message.type, mentionedUserIds: created.mentionedUserIds } });
    const recipientIds = created.participantIds.filter((id) => id !== user.userId);
    const eventName = created.message.parentMessageId ? 'CONVERSATION.REPLY_CREATED' : dto.type === ConversationMessageType.QUESTION ? 'CONVERSATION.QUESTION_CREATED' : 'CONVERSATION.MESSAGE_CREATED';
    await this.notifications.publishDomainEvent({
      organizationId, eventName, aggregateType: entityType, aggregateId: entityId, actorId: user.userId,
      idempotencyKey: `conversation:${created.message.id}:created`,
      payload: { threadId: created.thread.id, messageId: created.message.id, entityType, entityId, messageType: created.message.type, parentMessageId: created.message.parentMessageId, mentionedUserIds: created.mentionedUserIds, assigneeUserIds: recipientIds, ownerUserId: recipientIds[0], creatorUserId: recipientIds[0], actionUrl: entity.actionUrl, entityLabel: entity.label },
    });
    return this.presentMessage(created.message);
  }

  async markRead(entityType: ConversationEntityType, entityId: string, user: CurrentUserPayload) {
    this.assertEntityType(entityType);
    await this.access.assertReadable(entityType, entityId, user);
    const organizationId = getCurrentOrganizationId(user);
    return this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
      const thread = await tx.conversationThread.findUnique({ where: { organizationId_entityType_entityId: { organizationId, entityType, entityId } }, select: { id: true } });
      if (!thread) return { unreadCount: 0, lastReadAt: null };
      const lastReadAt = new Date();
      await tx.conversationParticipant.upsert({ where: { threadId_userId: { threadId: thread.id, userId: user.userId } }, create: { threadId: thread.id, userId: user.userId, lastReadAt }, update: { lastReadAt } });
      return { unreadCount: 0, lastReadAt };
    });
  }

  async updateMessage(messageId: string, dto: UpdateConversationMessageDto, user: CurrentUserPayload) {
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('متن پیام الزامی است.');
    const current = await this.getMessageWithAccess(messageId, user);
    if (current.message.authorId !== user.userId && !this.canModerate(user)) throw new ForbiddenException('اجازه ویرایش این پیام را ندارید.');
    if (current.message.senderType === 'ASSISTANT' || current.message.botStatus) throw new BadRequestException('پیام دستیار یا درخواست آن قابل ویرایش نیست.');
    if (current.message.deletedAt) throw new BadRequestException('پیام حذف‌شده قابل ویرایش نیست.');
    const references = dto.references ? await this.resolveReferences(dto.references, user) : undefined;
    const updated = await this.prisma.withTenantTransaction(tenantScope.require(user), async (tx) => {
      if (references) { await tx.conversationMessageReference.deleteMany({ where: { messageId, organizationId: current.message.organizationId } }); await tx.conversationMessageReference.createMany({ data: references.map((reference) => ({ organizationId: current.message.organizationId, messageId, referenceType: reference.type, referenceId: reference.id, labelSnapshot: reference.label })) }); }
      return tx.conversationMessage.update({ where: { id: messageId }, data: { body, editedAt: new Date() }, include: messageInclude });
    });
    await this.audit.record({ actorId: user.userId, organizationId: current.message.organizationId, entityType: 'conversation-message', entityId: messageId, action: 'conversation.message_edited' });
    return this.presentMessage(updated);
  }

  async deleteMessage(messageId: string, user: CurrentUserPayload) {
    const current = await this.getMessageWithAccess(messageId, user);
    if (current.message.senderType === 'ASSISTANT' || current.message.botStatus) throw new BadRequestException('پیام دستیار یا درخواست آن قابل حذف نیست.');
    if (current.message.authorId !== user.userId && !this.canModerate(user)) throw new ForbiddenException('اجازه حذف این پیام را ندارید.');
    const deletedAt = new Date();
    await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationMessage.update({ where: { id: messageId }, data: { deletedAt, deletedById: user.userId } }));
    await this.audit.record({ actorId: user.userId, organizationId: current.message.organizationId, entityType: 'conversation-message', entityId: messageId, action: 'conversation.message_deleted' });
    return { id: messageId, deletedAt };
  }

  async updateStatus(threadId: string, dto: UpdateConversationStatusDto, user: CurrentUserPayload) {
    const { thread, entity } = await this.getThreadWithAccess(threadId, user);
    if (thread.createdById !== user.userId && !this.canModerate(user)) throw new ForbiddenException('اجازه تغییر وضعیت گفتگو را ندارید.');
    const updated = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationThread.update({ where: { id: threadId }, data: { status: dto.status } }));
    await this.audit.record({ actorId: user.userId, organizationId: thread.organizationId, entityType: 'conversation-thread', entityId: threadId, action: `conversation.${dto.status.toLowerCase()}` });
    if (dto.status === 'RESOLVED') {
      const participantIds = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationParticipant.findMany({ where: { threadId }, select: { userId: true } }));
      const recipientIds = [...new Set([...participantIds.map((item) => item.userId), ...entity.responsibleUserIds])].filter((id) => id !== user.userId);
      await this.notifications.publishDomainEvent({ organizationId: thread.organizationId, eventName: 'CONVERSATION.RESOLVED', aggregateType: thread.entityType, aggregateId: thread.entityId, actorId: user.userId, idempotencyKey: `conversation:${threadId}:resolved:${updated.updatedAt.toISOString()}`, payload: { threadId, entityType: thread.entityType, entityId: thread.entityId, entityLabel: entity.label, assigneeUserIds: recipientIds, actionUrl: entity.actionUrl } });
    }
    return { id: updated.id, status: updated.status, updatedAt: updated.updatedAt };
  }

  private async getMessageWithAccess(messageId: string, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const message = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationMessage.findFirst({ where: { id: messageId, organizationId }, include: { thread: true } }));
    if (!message) throw new NotFoundException('Message not found');
    await this.access.assertReadable(message.thread.entityType, message.thread.entityId, user);
    return { message };
  }

  private async getThreadWithAccess(threadId: string, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const thread = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) => tx.conversationThread.findFirst({ where: { id: threadId, organizationId } }));
    if (!thread) throw new NotFoundException('Conversation not found');
    const entity = await this.access.assertReadable(thread.entityType, thread.entityId, user);
    return { thread, entity };
  }

  private canModerate(user: CurrentUserPayload) { return user.role === 'ADMIN' || user.role === 'MANAGER'; }
  private async resolveReferences(input: Array<{ type: ConversationMessageReferenceType; id: string }>, user: CurrentUserPayload) {
    const unique = [...new Map(input.map((item) => [`${item.type}:${item.id}`, item])).values()];
    return Promise.all(unique.map(async (item) => { const access = await this.access.assertReadable(referenceEntityTypes[item.type], item.id, user); return { ...item, label: access.label }; }));
  }
  private async withAttachments(tx: Prisma.TransactionClient, organizationId: string, messages: any[]) {
    if (!messages.length) return messages;
    if (!(tx as any).artifactLink) return messages.map((message) => ({ ...message, attachments: [] }));
    const links = await tx.artifactLink.findMany({ where: { organizationId, entityType: FileAttachmentEntityType.CONVERSATION_MESSAGE, entityId: { in: messages.map((message) => message.id) }, artifact: { deletedAt: null } }, include: { artifact: { select: { id: true, name: true, originalFileName: true, mimeType: true, sizeBytes: true } } } });
    const byMessage = new Map<string, any[]>(); for (const link of links) byMessage.set(link.entityId, [...(byMessage.get(link.entityId) ?? []), link.artifact]);
    return messages.map((message) => ({ ...message, attachments: byMessage.get(message.id) ?? [] }));
  }
  private assertEntityType(value: ConversationEntityType) { if (!Object.values(ConversationEntityType).includes(value)) throw new BadRequestException('نوع موجودیت گفتگو نامعتبر است.'); }
  private presentMessage(message: any) { return { ...message, body: message.deletedAt ? null : message.body, deletedById: undefined }; }
  private meta(total: number, page: number, limit: number) { const totalPages = Math.ceil(total / limit); return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 }; }
}
