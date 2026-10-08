import { ForbiddenException } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../src/common/decorators/permissions.decorator';
import { CollaborationController } from '../src/collaboration/collaboration.controller';
import { CollaborationService } from '../src/collaboration/collaboration.service';

describe('Collaboration centralized permissions', () => {
  const tenantContext = (permissions: string[]) => ({ tenantId: 'org-1', organizationId: 'org-1', userId: 'user-1', membershipId: 'membership-1', tenantRole: 'REP', permissions, platformAdmin: false, membershipStatus: 'active', resolutionSource: 'token-session' });
  const permission = (method: keyof CollaborationController) =>
    Reflect.getMetadata(PERMISSIONS_KEY, CollaborationController.prototype[method]);

  it.each([
    ['listTopics', 'collaboration:view'],
    ['createTopic', 'collaboration:topic:create'],
    ['updateTopic', 'collaboration:topic:update'],
    ['archiveTopic', 'collaboration:topic:delete'],
    ['createChannel', 'collaboration:channel:create'],
    ['updateChannel', 'collaboration:channel:update'],
    ['archiveChannel', 'collaboration:channel:delete'],
    ['addMember', 'collaboration:member:manage'],
    ['removeMember', 'collaboration:member:manage'],
  ] as const)('protects %s with %s', (method, action) => {
    expect(permission(method)).toEqual({ actions: [action], mode: 'all' });
  });

  it('rejects direct service mutation calls without the matching permission', async () => {
    const service = new CollaborationService({} as never, {} as never, {} as never);
    const user = { userId: 'user-1', tenantContext: { permissions: [] } } as never;
    await expect(service.createTopic({ name: 'موضوع', category: 'INTERNAL' }, user)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.archiveChannel('channel-1', user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes topic listing by tenant, category, archive state and channel access', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      withTenantTransaction: jest.fn().mockImplementation((_scope, callback) => callback({ collaborationTopic: { findMany } })),
    };
    const service = new CollaborationService(prisma as never, {} as never, {} as never);
    const user = {
      userId: 'user-1',
      tenantContext: tenantContext(['collaboration:view']),
    } as never;
    await service.listTopics(user, 'TENDER');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ organizationId: 'org-1', category: 'TENDER', archivedAt: null }),
    }));
    const where = findMany.mock.calls[0][0].where;
    expect(where.channels.some.OR).toEqual([
      { visibility: 'PUBLIC' },
      { members: { some: { userId: 'user-1' } } },
    ]);
  });

  it('archives a topic and all of its channels in one tenant transaction', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'topic-1' });
    const findFirst = jest.fn().mockResolvedValue({ id: 'topic-1' });
    const prisma = { withTenantTransaction: jest.fn().mockImplementation((_scope, callback) => callback({ collaborationTopic: { findFirst, update } })) };
    const audit = { recordTenantEvent: jest.fn().mockResolvedValue(undefined) };
    const service = new CollaborationService(prisma as never, {} as never, audit as never);
    const user = { userId: 'user-1', tenantContext: tenantContext(['collaboration:topic:delete']) } as never;
    await service.archiveTopic('topic-1', user);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'topic-1' },
      data: expect.objectContaining({ channels: { updateMany: { where: {}, data: { archivedAt: expect.any(Date) } } } }),
    }));
    expect(audit.recordTenantEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'collaboration.topic_archived', organizationId: 'org-1' }));
  });
});
