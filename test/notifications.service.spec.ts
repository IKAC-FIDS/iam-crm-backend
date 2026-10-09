import { NotificationPriority, NotificationType, UserRole } from '@prisma/client';
import { NotificationsService } from '../src/notifications/notifications.service';
import { tenantUser } from './helpers/tenant-user';

describe('NotificationsService metadata compatibility', () => {
  it('returns existing notification metadata unchanged', async () => {
    const metadata = {
      meetingTitle: 'معرفی محصول',
      meetingStartAt: '2026-07-27T04:30:00.000Z',
      meetingEndAt: '2026-07-27T05:30:00.000Z',
      reminderAt: '2026-07-27T04:15:00.000Z',
      organizationTimeZone: 'Asia/Tehran',
    };
    const notification = {
      id: 'notification-1',
      type: NotificationType.MEETING_REMINDER,
      metadata,
    };
    const prisma: any = {
      notification: {
        findMany: jest.fn().mockResolvedValue([notification]),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    prisma.withTenantTransaction = jest.fn(
      async (_context: unknown, callback: (tx: unknown) => unknown) =>
        callback(prisma),
    );
    const service = new NotificationsService(
      prisma as any,
      { record: jest.fn() } as any,
    );

    const result = await service.findAll(
      {},
      tenantUser({
        userId: 'user-1',
        email: 'user@example.com',
        role: UserRole.ADMIN,
        organizationId: 'organization-1',
      }),
    );

    expect(result.data[0].metadata).toBe(metadata);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          actor: {
            select: expect.objectContaining({ avatarObjectKey: true }),
          },
        }),
        where: {
          AND: [
            {
              organizationId: 'organization-1',
              recipientId: 'user-1',
            },
            { archivedAt: null },
          ],
        },
      }),
    );
  });

  it('continues searching notification title and body only', async () => {
    const prisma: any = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    prisma.withTenantTransaction = jest.fn(
      async (_context: unknown, callback: (tx: unknown) => unknown) =>
        callback(prisma),
    );
    const service = new NotificationsService(
      prisma as any,
      { record: jest.fn() } as any,
    );

    await service.findAll(
      { search: 'معرفی محصول' },
      tenantUser({
        userId: 'user-1',
        email: 'user@example.com',
        role: UserRole.ADMIN,
        organizationId: 'organization-1',
      }),
    );

    const where = prisma.notification.findMany.mock.calls[0][0].where;
    expect(where.AND[2]).toEqual({
      OR: [
        { title: { contains: 'معرفی محصول', mode: 'insensitive' } },
        { body: { contains: 'معرفی محصول', mode: 'insensitive' } },
      ],
    });
    expect(JSON.stringify(where)).not.toContain('metadata');
  });

  it('combines filters and applies priority sorting before pagination', async () => {
    const prisma: any = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    prisma.withTenantTransaction = jest.fn(
      async (_context: unknown, callback: (tx: unknown) => unknown) =>
        callback(prisma),
    );
    const service = new NotificationsService(
      prisma,
      { record: jest.fn() } as any,
    );

    await service.findAll(
      {
        page: 2,
        limit: 10,
        search: 'قرارداد',
        status: 'unread',
        type: NotificationType.OPPORTUNITY_UPDATED,
        priorities: [NotificationPriority.HIGH, NotificationPriority.URGENT],
        dateFrom: '2026-10-01T00:00:00.000Z',
        dateTo: '2026-10-09T23:59:59.999Z',
        sortBy: 'priority' as any,
        sortOrder: 'desc' as any,
      },
      tenantUser({
        userId: 'user-1',
        email: 'user@example.com',
        role: UserRole.ADMIN,
        organizationId: 'organization-1',
      }),
    );

    const options = prisma.notification.findMany.mock.calls[0][0];
    expect(options.skip).toBe(10);
    expect(options.take).toBe(10);
    expect(options.orderBy).toEqual([
      { priority: 'desc' },
      { createdAt: 'desc' },
      { id: 'desc' },
    ]);
    expect(options.where.AND).toEqual(expect.arrayContaining([
      { organizationId: 'organization-1', recipientId: 'user-1' },
      { type: NotificationType.OPPORTUNITY_UPDATED },
      { priority: { in: [NotificationPriority.HIGH, NotificationPriority.URGENT] } },
      { readAt: null },
      { archivedAt: null },
      {
        createdAt: {
          gte: new Date('2026-10-01T00:00:00.000Z'),
          lte: new Date('2026-10-09T23:59:59.999Z'),
        },
      },
    ]));
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: options.where });
  });

  it('uses deterministic oldest-first ordering', async () => {
    const prisma: any = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    prisma.withTenantTransaction = jest.fn(
      async (_context: unknown, callback: (tx: unknown) => unknown) => callback(prisma),
    );
    const service = new NotificationsService(prisma, { record: jest.fn() } as any);

    await service.findAll(
      { sortBy: 'createdAt' as any, sortOrder: 'asc' as any },
      tenantUser({ userId: 'user-1', email: 'user@example.com', role: UserRole.ADMIN, organizationId: 'organization-1' }),
    );

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    );
  });
});
