import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import type { CurrentUserPayload } from '../src/common/decorators/current-user.decorator';
import { CustomerRequestOperationsService } from '../src/customer-requests/customer-request-operations.service';

const user = (
  permissions: string[] = [
    'customer-request:triage',
    'customer-request:assign',
    'customer-request:route',
    'customer-request:link',
    'task:view',
    'task:create',
  ],
): CurrentUserPayload => ({
  userId: '00000000-0000-4000-8000-000000000001',
  email: 'internal@example.test',
  role: 'ADMIN',
  organizationId: '00000000-0000-4000-8000-000000000010',
  activeOrganizationId: '00000000-0000-4000-8000-000000000010',
  membershipId: '00000000-0000-4000-8000-000000000011',
  tenantContext: {
    tenantId: '00000000-0000-4000-8000-000000000010',
    organizationId: '00000000-0000-4000-8000-000000000010',
    userId: '00000000-0000-4000-8000-000000000001',
    membershipId: '00000000-0000-4000-8000-000000000011',
    tenantRole: 'ADMIN',
    permissions,
    platformAdmin: false,
    membershipStatus: 'active',
    resolutionSource: 'token-session',
  },
});

const request = {
  id: '00000000-0000-4000-8000-000000000020',
  organizationId: '00000000-0000-4000-8000-000000000010',
  companyId: '00000000-0000-4000-8000-000000000030',
  status: 'SUBMITTED',
  priority: 'NORMAL',
  triageStatus: 'UNTRIAGED',
  assignedToId: null,
  responsibleTeamId: null,
  routingDestination: null,
  revision: 1,
  requestType: { defaultRoutingDestination: 'MANUAL' },
};

function createService(overrides: Record<string, unknown> = {}) {
  const tx = {
    customerRequest: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ ...request, revision: 2 }),
    },
    customerRequestOperationalHistory: { create: jest.fn().mockResolvedValue({}) },
    customerRequestCrmLink: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'link-1' }),
      update: jest.fn(),
    },
  };
  const prisma: any = {
    customerRequest: { findFirst: jest.fn().mockResolvedValue(request) },
    customerRequestType: { findMany: jest.fn().mockResolvedValue([]) },
    customerRequestOperationalHistory: { findMany: jest.fn() },
    customerRequestCrmLink: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn(),
    },
    customerRequestCrmCreationAttempt: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findFirst: jest.fn() },
    team: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    ...overrides,
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const companyAccess = {
    assertCompanyReadable: jest.fn().mockResolvedValue(undefined),
  };
  const tasks = {
    assertReadable: jest.fn(),
    create: jest.fn(),
  };
  const opportunities = { findOne: jest.fn(), create: jest.fn() };
  const technical = { getDocument: jest.fn(), createDocument: jest.fn() };
  const service = new CustomerRequestOperationsService(
    prisma,
    audit as any,
    companyAccess as any,
    tasks as any,
    opportunities as any,
    technical as any,
  );
  return { service, prisma, tx, audit, companyAccess, tasks };
}

describe('Stage 4 customer request operations', () => {
  it('rejects stale triage updates and writes no history', async () => {
    const { service, tx } = createService();
    tx.customerRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateTriage(request.id, { expectedRevision: 1 }, user()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.customerRequestOperationalHistory.create).not.toHaveBeenCalled();
  });

  it('requires the dedicated assignment permission', async () => {
    const { service } = createService();

    await expect(
      service.updateTriage(
        request.id,
        { expectedRevision: 1, assignedToId: user().userId },
        user(['customer-request:triage']),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a CRM record belonging to another company', async () => {
    const { service, tasks } = createService();
    tasks.assertReadable.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000040',
      companyId: '00000000-0000-4000-8000-000000000099',
    });

    await expect(
      service.linkExisting(
        request.id,
        {
          targetType: 'TASK',
          targetId: '00000000-0000-4000-8000-000000000040',
        },
        user(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes every request lookup to the active tenant', async () => {
    const { service, prisma } = createService();
    await service.links(request.id, user());

    expect(prisma.customerRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: request.id,
          organizationId: request.organizationId,
        }),
      }),
    );
  });

  it('scopes triage options to the active tenant', async () => {
    const { service, prisma } = createService();
    await service.options(user());

    expect(prisma.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: request.organizationId, isActive: true },
      }),
    );
    expect(prisma.customerRequestType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: request.organizationId, retiredAt: null },
      }),
    );
  });

  it('reuses an idempotent active link without creating a second Task', async () => {
    const { service, prisma, tasks } = createService();
    prisma.customerRequestCrmLink.findFirst.mockResolvedValue({
      id: 'link-existing',
      idempotencyKey: 'retry-key-1',
      task: { id: 'task-existing', title: 'existing' },
    });

    await expect(
      service.createTask(
        request.id,
        { title: 'پیگیری', idempotencyKey: 'retry-key-1' },
        user(),
      ),
    ).resolves.toMatchObject({ id: 'link-existing' });
    expect(tasks.create).not.toHaveBeenCalled();
    expect(prisma.customerRequestCrmCreationAttempt.create).not.toHaveBeenCalled();
  });

  it('forces newly created Tasks to the request company', async () => {
    const { service, prisma, tasks, tx } = createService();
    prisma.customerRequestCrmCreationAttempt.findUnique.mockResolvedValue(null);
    prisma.customerRequestCrmCreationAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      targetType: 'TASK',
      targetId: null,
    });
    prisma.customerRequestCrmCreationAttempt.update.mockResolvedValue({});
    tasks.create.mockResolvedValue({ id: 'task-1' });
    tx.customerRequestCrmLink.create.mockResolvedValue({
      id: 'link-1',
      task: { id: 'task-1', title: 'پیگیری' },
    });

    await service.createTask(
      request.id,
      { title: 'پیگیری', idempotencyKey: 'new-task-key' },
      user(),
    );

    expect(tasks.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: request.companyId }),
      expect.objectContaining({ userId: user().userId }),
    );
  });
});
