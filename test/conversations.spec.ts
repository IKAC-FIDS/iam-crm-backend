import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ForbiddenException } from '@nestjs/common';
import { ConversationEntityType } from '@prisma/client';
import { validate } from 'class-validator';
import { ConversationAccessService } from '../src/conversations/conversation-access.service';
import { CreateConversationMessageDto } from '../src/conversations/dto/conversation.dto';
import { NotificationRulesService } from '../src/notification-core/notification-rules.service';
import { ConversationsService } from '../src/conversations/conversations.service';
import { tenantUser } from './helpers/tenant-user';

describe('Conversation architecture', () => {
  const companies = { assertCompanyReadable: jest.fn() };
  const tasks = { assertReadable: jest.fn() };
  const activities = { assertReadable: jest.fn() };
  const opportunities = { findOne: jest.fn() };
  const meetings = { findOne: jest.fn() };
  const collaboration = { assertReadable: jest.fn() };
  const service = new ConversationAccessService(
    companies as never,
    tasks as never,
    activities as never,
    opportunities as never,
    meetings as never,
    collaboration as never,
  );
  const user = {
    userId: 'user-1',
    tenantContext: { permissions: ['opportunity:view', 'meeting:view'] },
  } as never;

  beforeEach(() => jest.clearAllMocks());

  it('inherits Company access and resolves its responsible owner', async () => {
    companies.assertCompanyReadable.mockResolvedValue({ id: 'company-1', legalName: 'شرکت', brandName: null, ownerId: 'owner-1' });
    await expect(service.assertReadable(ConversationEntityType.COMPANY, 'company-1', user)).resolves.toEqual(expect.objectContaining({ responsibleUserIds: ['owner-1'] }));
    expect(companies.assertCompanyReadable).toHaveBeenCalledWith('company-1', user);
  });

  it('inherits Task access and resolves assignee and reviewer', async () => {
    tasks.assertReadable.mockResolvedValue({ id: 'task-1', title: 'کار', assignedToId: 'user-2', reviewerId: 'user-3' });
    await expect(service.assertReadable(ConversationEntityType.TASK, 'task-1', user)).resolves.toEqual(expect.objectContaining({ responsibleUserIds: ['user-2', 'user-3'] }));
  });

  it('inherits Activity access and resolves the activity user', async () => {
    activities.assertReadable.mockResolvedValue({ id: 'activity-1', type: 'CALL', outcome: null, notes: null, userId: 'user-4' });
    await expect(service.assertReadable(ConversationEntityType.ACTIVITY, 'activity-1', user)).resolves.toEqual(expect.objectContaining({ responsibleUserIds: ['user-4'] }));
  });

  it('inherits Opportunity access and resolves its owner', async () => {
    opportunities.findOne.mockResolvedValue({
      id: 'opportunity-1',
      title: 'فرصت فروش',
      ownerId: 'owner-1',
    });
    await expect(
      service.assertReadable(
        ConversationEntityType.OPPORTUNITY,
        'opportunity-1',
        user,
      ),
    ).resolves.toEqual(
      expect.objectContaining({ responsibleUserIds: ['owner-1'] }),
    );
  });

  it('inherits Meeting access and resolves organizer and assignees', async () => {
    meetings.findOne.mockResolvedValue({
      id: 'meeting-1',
      title: 'جلسه فروش',
      organizerId: 'organizer-1',
      assignees: [
        { userId: 'assignee-1' },
        { userId: 'organizer-1' },
      ],
    });
    await expect(
      service.assertReadable(ConversationEntityType.MEETING, 'meeting-1', user),
    ).resolves.toEqual(
      expect.objectContaining({
        responsibleUserIds: ['organizer-1', 'assignee-1'],
      }),
    );
  });

  it('routes collaboration channels through collaboration access without duplicating messaging', async () => {
    collaboration.assertReadable.mockResolvedValue({
      id: 'channel-1',
      name: 'فروش',
      topic: { name: 'پروژه IAM' },
      members: [{ role: 'MEMBER' }],
    });
    await expect(
      service.assertReadable(
        ConversationEntityType.COLLABORATION_CHANNEL,
        'channel-1',
        user,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        label: 'پروژه IAM / فروش',
        actionUrl: '/collaboration?channel=channel-1',
      }),
    );
    expect(collaboration.assertReadable).toHaveBeenCalledWith('channel-1', user);
  });

  it('does not expose opportunity or meeting conversations without entity view permission', async () => {
    const restrictedUser = {
      userId: 'user-1',
      tenantContext: { permissions: [] },
    } as never;
    await expect(
      service.assertReadable(
        ConversationEntityType.OPPORTUNITY,
        'opportunity-1',
        restrictedUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.assertReadable(
        ConversationEntityType.MEETING,
        'meeting-1',
        restrictedUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('defines additive uniqueness, indexes and fail-closed RLS policies', () => {
    const sql = readFileSync(join(process.cwd(), 'prisma/migrations/20260917120000_conversations/migration.sql'), 'utf8');
    expect(sql).toContain('conversation_threads_organizationId_entityType_entityId_key');
    expect(sql.match(/ENABLE ROW LEVEL SECURITY/g)).toHaveLength(3);
    expect(sql.match(/FORCE ROW LEVEL SECURITY/g)).toHaveLength(3);
    expect(sql).toContain("current_setting('app.current_organization_id', true)");
    expect(sql).not.toContain('SECURITY DEFINER');
  });

  it('exposes every conversation event to the notification rule editor', () => {
    const rules = new NotificationRulesService({} as never, {} as never, {} as never);
    expect(rules.catalog().events).toEqual(expect.arrayContaining([
      'CONVERSATION.MESSAGE_CREATED',
      'CONVERSATION.QUESTION_CREATED',
      'CONVERSATION.REPLY_CREATED',
      'CONVERSATION.RESOLVED',
    ]));
  });

  it('accepts unique UUID mentions and rejects duplicate recipients', async () => {
    const valid = Object.assign(new CreateConversationMessageDto(), {
      body: 'لطفاً بررسی کنید',
      type: 'COMMENT',
      mentionedUserIds: [
        '05eb8df2-d20b-4d86-8dbf-9747af0eaa7f',
        'ef9f3a15-8fcb-45a4-b2fd-76e6c1ca7359',
      ],
    });
    expect(await validate(valid)).toHaveLength(0);

    valid.mentionedUserIds = [
      '05eb8df2-d20b-4d86-8dbf-9747af0eaa7f',
      '05eb8df2-d20b-4d86-8dbf-9747af0eaa7f',
    ];
    expect(await validate(valid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'mentionedUserIds' }),
      ]),
    );
  });

  it('loads the newest message page and renders that page chronologically', async () => {
    const messages = [
      { id: 'newest', createdAt: new Date('2026-10-02T10:00:00Z'), body: 'new', deletedAt: null, author: {}, parentMessage: null },
      { id: 'older', createdAt: new Date('2026-10-02T09:00:00Z'), body: 'old', deletedAt: null, author: {}, parentMessage: null },
    ];
    const tx = {
      conversationThread: { findUnique: jest.fn().mockResolvedValue({ id: 'thread-1', status: 'OPEN', createdById: 'user-1', createdAt: new Date(), updatedAt: new Date(), participants: [] }) },
      conversationMessage: {
        findMany: jest.fn().mockResolvedValue(messages),
        count: jest.fn().mockResolvedValueOnce(150).mockResolvedValueOnce(0),
      },
    };
    const prisma = { withTenantTransaction: jest.fn((_tenant, callback) => callback(tx)) };
    const access = { assertReadable: jest.fn().mockResolvedValue({}) };
    const conversations = new ConversationsService(prisma as never, access as never, {} as never, {} as never, {} as never);
    const scopedUser = tenantUser({ userId: 'user-1', email: 'u@example.com', role: 'REP' as never, organizationId: 'org-1' } as never);
    const result = await conversations.find(ConversationEntityType.COMPANY, 'company-1', { page: 1, limit: 100 }, scopedUser);
    expect(tx.conversationMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100 }));
    expect(result.messages.map((item) => item.id)).toEqual(['older', 'newest']);
    expect(result.meta).toMatchObject({ total: 150, hasNext: true });
  });

  it('builds a company hub from direct, task and activity threads in batched queries', async () => {
    const tx = {
      company: { findFirst: jest.fn().mockResolvedValue({ id: 'company-1', legalName: 'شرکت', brandName: null }) },
      task: { findMany: jest.fn().mockResolvedValue([{ id: 'task-1', title: 'پیگیری پیشنهاد' }]) },
      activity: { findMany: jest.fn().mockResolvedValue([{ id: 'activity-1', type: 'CALL', notes: 'تماس تلفنی' }]) },
      conversationThread: { findMany: jest.fn().mockResolvedValue([
        { id: 'thread-company', entityType: 'COMPANY', entityId: 'company-1', status: 'OPEN', updatedAt: new Date(), participants: [], messages: [] },
        { id: 'thread-task', entityType: 'TASK', entityId: 'task-1', status: 'OPEN', updatedAt: new Date(), participants: [], messages: [] },
        { id: 'thread-activity', entityType: 'ACTIVITY', entityId: 'activity-1', status: 'OPEN', updatedAt: new Date(), participants: [], messages: [] },
      ]) },
      $queryRaw: jest.fn().mockResolvedValue([{ threadId: 'thread-task', unreadCount: 2 }]),
    };
    const prisma = { withTenantTransaction: jest.fn((_tenant, callback) => callback(tx)) };
    const access = { assertReadable: jest.fn().mockResolvedValue({}) };
    const conversations = new ConversationsService(prisma as never, access as never, {} as never, {} as never, {} as never);
    const scopedUser = tenantUser({ userId: 'user-1', email: 'u@example.com', role: 'ADMIN' as never, organizationId: 'org-1' } as never);
    (scopedUser as any).tenantContext.permissions = ['task:view', 'activity:view', 'task:view-organization', 'activity:view-organization'];
    const result = await conversations.findCompanyHub('company-1', scopedUser);
    expect(result.threads).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityType: 'TASK', entityLabel: 'پیگیری پیشنهاد', unreadCount: 2 }),
      expect.objectContaining({ entityType: 'ACTIVITY', entityLabel: 'تماس تلفنی' }),
    ]));
    expect(result.counts).toMatchObject({ all: 3, company: 1, tasks: 1, activities: 1, unread: 2 });
    expect(tx.conversationThread.findMany).toHaveBeenCalledTimes(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });
});
