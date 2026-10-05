import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConversationMessageType } from '@prisma/client';
import { ConversationsService } from '../src/conversations/conversations.service';
import type { CurrentUserPayload } from '../src/common/decorators/current-user.decorator';
import { CollaborationAccessService } from '../src/collaboration/collaboration-access.service';
import { tenantUser } from './helpers/tenant-user';

describe('Collaboration conversation bot', () => {
  const user = tenantUser({
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.test',
    role: 'REP' as never,
    organizationId: '22222222-2222-4222-8222-222222222222',
  } as never) as CurrentUserPayload;
  const channelId = '33333333-3333-4333-8333-333333333333';
  const requestId = '44444444-4444-4444-8444-444444444444';

  function setup(answer: string | Error = 'پاسخ مجاز') {
    const request = {
      id: 'request-message', threadId: 'thread-1', organizationId: user.tenantContext!.organizationId,
      authorId: user.userId, author: { id: user.userId, fullName: 'کاربر', avatarObjectKey: null },
      senderType: 'USER', botStatus: 'PENDING', botRequestKey: 'key', botResponseToId: null,
      body: 'خلاصه کن', type: ConversationMessageType.COMMENT, references: [], createdAt: new Date(), deletedAt: null,
    };
    const response = { ...request, id: 'assistant-message', authorId: null, author: null, senderType: 'ASSISTANT', botStatus: null, body: 'پاسخ مجاز', botResponseToId: request.id };
    const tx = {
      conversationMessage: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([
          { id: 'old', body: 'اطلاعات قبلی', senderType: 'USER', createdAt: new Date(), author: { fullName: 'همکار' }, references: [] },
          request,
        ]),
        create: jest.fn().mockResolvedValue(response),
        update: jest.fn().mockResolvedValue(request),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      conversationParticipant: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { withTenantTransaction: jest.fn((_tenant, callback) => callback(tx)) };
    const access = {
      assertReadable: jest.fn().mockResolvedValue({ label: 'فروش / تمدید', responsibleUserIds: [] }),
      resolveAssistantReference: jest.fn(),
    };
    const assistant = { ask: answer instanceof Error ? jest.fn().mockRejectedValue(answer) : jest.fn().mockResolvedValue({ answer }) };
    const service = new ConversationsService(prisma as never, access as never, {} as never, {} as never, {} as never, assistant as never);
    jest.spyOn(service, 'createMessage').mockResolvedValue(request as never);
    return { service, prisma, access, assistant, tx, request };
  }

  it('persists one user request and one identifiable assistant response with bounded history', async () => {
    const { service, assistant, tx, request } = setup();
    const result = await service.askBot(channelId, { body: '/bot خلاصه کن', type: ConversationMessageType.COMMENT, requestId }, user);
    expect(service.createMessage).toHaveBeenCalledWith('COLLABORATION_CHANNEL', channelId, expect.objectContaining({ body: 'خلاصه کن' }), user, expect.stringContaining(requestId));
    expect(tx.conversationMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }));
    expect(assistant.ask).toHaveBeenCalledWith({ message: 'خلاصه کن' }, user, expect.objectContaining({ context: expect.objectContaining({ recentMessages: expect.any(Array) }) }));
    expect(tx.conversationMessage.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ authorId: null, senderType: 'ASSISTANT', botResponseToId: request.id }) }));
    expect(result.response.senderType).toBe('ASSISTANT');
  });

  it('keeps the user message and marks it failed when assistant execution fails', async () => {
    const { service, tx } = setup(new Error('provider secret detail'));
    await expect(service.askBot(channelId, { body: 'خلاصه کن', type: ConversationMessageType.COMMENT, requestId }, user)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(tx.conversationMessage.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { botStatus: 'FAILED' } }));
    expect(tx.conversationMessage.create).not.toHaveBeenCalled();
  });

  it('rejects before persistence when channel access is denied', async () => {
    const { service, access, assistant } = setup();
    access.assertReadable.mockRejectedValueOnce(new ForbiddenException());
    await expect(service.askBot(channelId, { body: 'خلاصه کن', type: ConversationMessageType.COMMENT, requestId }, user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(service.createMessage).not.toHaveBeenCalled();
    expect(assistant.ask).not.toHaveBeenCalled();
  });
});

describe('Collaboration bot channel boundary', () => {
  const user = tenantUser({ userId: 'user-1', email: 'user@example.test', role: 'REP' as never, organizationId: 'org-1' } as never) as CurrentUserPayload;

  it('scopes channel lookup to the active tenant and private membership', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'channel-1', topic: {}, members: [{ role: 'MEMBER' }] });
    const prisma = { withTenantTransaction: jest.fn((_tenant, callback) => callback({ collaborationChannel: { findFirst } })) };
    await new CollaborationAccessService(prisma as never).assertReadable('channel-1', user);
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      id: 'channel-1', organizationId: 'org-1',
      OR: [{ visibility: 'PUBLIC' }, { members: { some: { userId: 'user-1' } } }],
    }) }));
  });

  it('rejects inaccessible or cross-tenant channels without revealing their existence', async () => {
    const prisma = { withTenantTransaction: jest.fn((_tenant, callback) => callback({ collaborationChannel: { findFirst: jest.fn().mockResolvedValue(null) } })) };
    await expect(new CollaborationAccessService(prisma as never).assertReadable('foreign-channel', user)).rejects.toMatchObject({ status: 404 });
  });
});
