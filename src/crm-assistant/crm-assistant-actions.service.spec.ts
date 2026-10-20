import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CrmAssistantActionsService } from './crm-assistant-actions.service';

const user = {
  userId: '11111111-1111-4111-8111-111111111111', email: 'user@example.com', role: 'REP' as const,
  activeOrganizationId: '22222222-2222-4222-8222-222222222222', membershipId: '33333333-3333-4333-8333-333333333333',
  tenantContext: {
    tenantId: '22222222-2222-4222-8222-222222222222', organizationId: '22222222-2222-4222-8222-222222222222',
    userId: '11111111-1111-4111-8111-111111111111', membershipId: '33333333-3333-4333-8333-333333333333', tenantRole: 'REP',
    permissions: ['company:create', 'opportunity:create', 'task:create'], platformAdmin: false,
    membershipStatus: 'active' as const, resolutionSource: 'token-session' as const,
  },
};

describe('CrmAssistantActionsService', () => {
  const executions = new Map<string, any>();
  const executionModel = {
    create: jest.fn(async ({ data }: any) => {
      if (executions.has(data.nonce)) throw Object.assign(new Error('unique'), { code: 'P2002' });
      const row = { id: `execution-${data.nonce}`, status: 'EXECUTING', responsePayload: null, ...data };
      executions.set(data.nonce, row);
      return row;
    }),
    findFirst: jest.fn(async ({ where }: any) => {
      const row = executions.get(where.nonce);
      return row && Object.entries(where).every(([key, value]) => row[key] === value) ? row : null;
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const row = executions.get(where.nonce);
      if (!row || !Object.entries(where).every(([key, value]) => row[key] === value)) return { count: 0 };
      executions.set(where.nonce, { ...row, ...data });
      return { count: 1 };
    }),
  };
  const prisma = {
    withTenantTransaction: jest.fn(async (_context: any, callback: any) => callback({ assistantActionExecution: executionModel })),
  };
  const companies = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const opportunities = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const tasks = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const people = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const activities = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const meetings = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const timesheets = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const leaveRequests = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>() };
  const config = { get: jest.fn((key: string) => key === 'ASSISTANT_ACTION_SECRET' ? 'test-secret-with-enough-entropy' : undefined) };
  let service: CrmAssistantActionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    executions.clear();
    service = new CrmAssistantActionsService(
      config as any, prisma as any, companies as any, opportunities as any, tasks as any, people as any,
      activities as any, meetings as any, timesheets as any, leaveRequests as any, audit as any,
    );
  });

  it('only exposes action tools covered by effective permissions', () => {
    expect(service.listFor({ ...user, tenantContext: { ...user.tenantContext, permissions: ['task:create'] } } as any).map((item) => item.name))
      .toEqual(['propose_create_task']);
    expect(service.propose('propose_create_company', { legalName: 'آزمون' }, { ...user, tenantContext: { ...user.tenantContext, permissions: [] } } as any))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates only after confirmation and returns the durable result on replay', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون', priority: 'HIGH' }, user as any);
    expect(companies.create).not.toHaveBeenCalled();

    const result = await service.confirm(proposal.token, user as any);
    expect(result.entity.label).toBe('شرکت آزمون');
    expect(companies.create).toHaveBeenCalledTimes(1);
    await expect(service.confirm(proposal.token, user as any)).resolves.toEqual(result);
    expect(companies.create).toHaveBeenCalledTimes(1);
  });

  it('binds confirmation tokens to the proposing user and organization session', async () => {
    const proposal = await service.propose('propose_create_task', { title: 'پیگیری مشتری' }, user as any);
    await expect(service.confirm(proposal.token, { ...user, userId: '55555555-5555-4555-8555-555555555555' } as any))
      .rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.confirm(proposal.token, {
      ...user,
      activeOrganizationId: '66666666-6666-4666-8666-666666666666',
      tenantContext: {
        ...user.tenantContext,
        tenantId: '66666666-6666-4666-8666-666666666666',
        organizationId: '66666666-6666-4666-8666-666666666666',
      },
    } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tasks.create).not.toHaveBeenCalled();
  });

  it('rechecks permissions at confirmation time', async () => {
    const proposal = await service.propose('propose_create_task', { title: 'پیگیری مشتری' }, user as any);
    const revoked = { ...user, tenantContext: { ...user.tenantContext, permissions: [] } };

    await expect(service.confirm(proposal.token, revoked as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(tasks.create).not.toHaveBeenCalled();
  });

  it('rejects an expired confirmation token', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const proposal = await service.propose('propose_create_task', { title: 'پیگیری مشتری' }, user as any);
    clock.mockReturnValue(now + 5 * 60_000 + 1);

    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tasks.create).not.toHaveBeenCalled();
    clock.mockRestore();
  });

  it('allows only one concurrent confirmation to create the entity', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);

    const results = await Promise.allSettled([
      service.confirm(proposal.token, user as any),
      service.confirm(proposal.token, user as any),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(companies.create).toHaveBeenCalledTimes(1);
  });

  it('allows only one of twenty simultaneous confirmations to create the entity', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => service.confirm(proposal.token, user as any)),
    );

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(19);
    expect(companies.create).toHaveBeenCalledTimes(1);
  });

  it('executes different valid tokens independently', async () => {
    companies.create
      .mockResolvedValueOnce({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت اول', brandName: null })
      .mockResolvedValueOnce({ id: '55555555-5555-4555-8555-555555555555', legalName: 'شرکت دوم', brandName: null });
    const first = await service.propose('propose_create_company', { legalName: 'شرکت اول' }, user as any);
    const second = await service.propose('propose_create_company', { legalName: 'شرکت دوم' }, user as any);

    const results = await Promise.all([
      service.confirm(first.token, user as any),
      service.confirm(second.token, user as any),
    ]);

    expect(results.map((result) => result.entity.id)).toEqual([
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555',
    ]);
    expect(companies.create).toHaveBeenCalledTimes(2);
  });

  it('coordinates two service instances through the shared durable ledger', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const second = new CrmAssistantActionsService(
      config as any, prisma as any, companies as any, opportunities as any, tasks as any, people as any,
      activities as any, meetings as any, timesheets as any, leaveRequests as any, audit as any,
    );
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);

    const results = await Promise.allSettled([
      service.confirm(proposal.token, user as any),
      second.confirm(proposal.token, user as any),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(companies.create).toHaveBeenCalledTimes(1);
  });

  it('recovers a successful result after constructing a new service instance', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);
    const first = await service.confirm(proposal.token, user as any);
    const restarted = new CrmAssistantActionsService(
      config as any, prisma as any, companies as any, opportunities as any, tasks as any, people as any,
      activities as any, meetings as any, timesheets as any, leaveRequests as any, audit as any,
    );

    await expect(restarted.confirm(proposal.token, user as any)).resolves.toEqual(first);
    expect(companies.create).toHaveBeenCalledTimes(1);
    expect(audit.recordTenantEvent).toHaveBeenCalledTimes(1);
  });

  it('does not execute a durable claim left in progress by a crashed process', async () => {
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);
    const [encoded] = proposal.token.split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    executions.set(payload.nonce, {
      nonce: payload.nonce,
      organizationId: payload.organizationId,
      userId: payload.userId,
      membershipId: payload.membershipId,
      actionType: payload.action,
      status: 'EXECUTING',
      responsePayload: null,
    });

    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(ConflictException);
    expect(companies.create).not.toHaveBeenCalled();
  });

  it('fails closed after an ambiguous domain error and never retries the mutation', async () => {
    companies.create.mockRejectedValueOnce(new Error('connection lost after commit'));
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);

    await expect(service.confirm(proposal.token, user as any)).rejects.toThrow('connection lost after commit');
    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(ConflictException);
    expect(companies.create).toHaveBeenCalledTimes(1);
    expect([...executions.values()][0].status).toBe('REQUIRES_RECONCILIATION');
  });

  it('does not execute the mutation when the durable claim cannot be persisted', async () => {
    prisma.withTenantTransaction.mockRejectedValueOnce(new Error('database unavailable'));
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);

    await expect(service.confirm(proposal.token, user as any)).rejects.toThrow('database unavailable');
    expect(companies.create).not.toHaveBeenCalled();
  });

  it('keeps the claim for reconciliation when completion persistence is ambiguous', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    executionModel.updateMany.mockResolvedValueOnce({ count: 0 });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);

    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(ConflictException);
    expect(companies.create).toHaveBeenCalledTimes(1);
    expect([...executions.values()][0].status).toBe('REQUIRES_RECONCILIATION');
  });

  it('rejects an expired token even when a successful result was persisted', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون' }, user as any);
    await service.confirm(proposal.token, user as any);
    clock.mockReturnValue(now + 5 * 60_000 + 1);

    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(companies.create).toHaveBeenCalledTimes(1);
    clock.mockRestore();
  });
});
