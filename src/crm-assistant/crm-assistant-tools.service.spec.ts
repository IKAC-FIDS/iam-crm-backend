import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CrmAssistantToolsService } from './crm-assistant-tools.service';

describe('CrmAssistantToolsService', () => {
  const companies = { findAll: jest.fn<(...args: any[]) => Promise<any>>() };
  const opportunities = { findAll: jest.fn<(...args: any[]) => Promise<any>>() };
  const tasks = { findAll: jest.fn<(...args: any[]) => Promise<any>>() };
  const meetings = { findAll: jest.fn<(...args: any[]) => Promise<any>>() };
  const people = { findDirectory: jest.fn<(...args: any[]) => Promise<any>>() };
  const activities = { findAll: jest.fn<(...args: any[]) => Promise<any>>() };
  const timesheets = { findMine: jest.fn<(...args: any[]) => Promise<any>>() };
  const leaveRequests = { findMine: jest.fn<(...args: any[]) => Promise<any>>() };
  const service = new CrmAssistantToolsService(
    companies as never,
    opportunities as never,
    tasks as never,
    meetings as never,
    people as never,
    activities as never,
    timesheets as never,
    leaveRequests as never,
  );
  const user = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'REP',
    tenantContext: { permissions: ['company:view'] },
  } as unknown as CurrentUserPayload;

  beforeEach(() => { jest.clearAllMocks(); });

  it('only exposes tools allowed by tenant permissions', () => {
    expect(service.listFor(user).map((tool) => tool.name)).toEqual(['search_companies']);
  });

  it('rejects calls outside the current permission set', async () => {
    await expect(service.call('search_opportunities', {}, user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('bounds limits and returns a compact company projection', async () => {
    companies.findAll.mockResolvedValue({
      data: [{ id: 'c1', legalName: 'شرکت نمونه', brandName: null, status: 'ACTIVE', priority: 'HIGH', industry: 'فناوری', owner: null, updatedAt: new Date('2026-09-24') }],
      meta: { total: 1 },
    });

    const result = await service.call('search_companies', { search: ' نمونه ', limit: 999 }, user);
    expect(companies.findAll).toHaveBeenCalledWith(
      user,
      { page: 1, limit: 20, search: 'نمونه' },
      { search: 'نمونه' },
    );
    expect(result).toMatchObject({ data: [{ id: 'c1', name: 'شرکت نمونه' }], meta: { total: 1 } });
  });
});
