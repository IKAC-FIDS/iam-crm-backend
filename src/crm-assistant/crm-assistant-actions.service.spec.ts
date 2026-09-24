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
  const companies = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const opportunities = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const tasks = { create: jest.fn<(...args: any[]) => Promise<any>>() };
  const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>() };
  const config = { get: jest.fn((key: string) => key === 'ASSISTANT_ACTION_SECRET' ? 'test-secret-with-enough-entropy' : undefined) };
  let service: CrmAssistantActionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CrmAssistantActionsService(config as any, companies as any, opportunities as any, tasks as any, audit as any);
  });

  it('only exposes action tools covered by effective permissions', () => {
    expect(service.listFor({ ...user, tenantContext: { ...user.tenantContext, permissions: ['task:create'] } } as any).map((item) => item.name))
      .toEqual(['propose_create_task']);
    expect(service.propose('propose_create_company', { legalName: 'آزمون' }, { ...user, tenantContext: { ...user.tenantContext, permissions: [] } } as any))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates only after confirmation and rejects token replay', async () => {
    companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
    const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون', priority: 'HIGH' }, user as any);
    expect(companies.create).not.toHaveBeenCalled();

    const result = await service.confirm(proposal.token, user as any);
    expect(result.entity.label).toBe('شرکت آزمون');
    expect(companies.create).toHaveBeenCalledTimes(1);
    await expect(service.confirm(proposal.token, user as any)).rejects.toBeInstanceOf(ConflictException);
  });

  it('binds confirmation tokens to the proposing user and organization session', async () => {
    const proposal = await service.propose('propose_create_task', { title: 'پیگیری مشتری' }, user as any);
    await expect(service.confirm(proposal.token, { ...user, userId: '55555555-5555-4555-8555-555555555555' } as any))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(tasks.create).not.toHaveBeenCalled();
  });
});
