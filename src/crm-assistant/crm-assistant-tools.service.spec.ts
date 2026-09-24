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
  const reports = { getFilterOptions: jest.fn<(...args: any[]) => Promise<any>>(), getUserPerformance: jest.fn<(...args: any[]) => Promise<any>>(), getPipelineByOwner: jest.fn<(...args: any[]) => Promise<any>>() };
  const advancedReports = { taskPerformance: jest.fn<(...args: any[]) => Promise<any>>(), meetingPerformance: jest.fn<(...args: any[]) => Promise<any>>() };
  const service = new CrmAssistantToolsService(
    companies as never,
    opportunities as never,
    tasks as never,
    meetings as never,
    people as never,
    activities as never,
    timesheets as never,
    leaveRequests as never,
    reports as never,
    advancedReports as never,
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

  it('builds a scoped sales-rep performance report from authoritative report services', async () => {
    const reportUser = { ...user, tenantContext: { permissions: ['report:view'] } } as unknown as CurrentUserPayload;
    const userId = '11111111-1111-4111-8111-111111111111';
    reports.getFilterOptions.mockResolvedValue({ users: [{ id: userId, fullName: 'کارشناس نمونه', teamId: null, teamName: null, teamCode: null, role: 'REP' }] });
    reports.getUserPerformance.mockResolvedValue({
      period: { startDate: '2026-09-01', endDate: '2026-09-24' }, financialVisible: false,
      members: [{ user: { id: userId, fullName: 'کارشناس نمونه' }, activity: { total: 5, breakdown: [] }, companiesCreated: 2, meetings: 3, tasksCreated: 4, tasksAssigned: { total: 4, completed: 3, incomplete: 1 }, opportunities: { total: 2, active: 1, won: 1, lost: 0 } }],
    });
    reports.getPipelineByOwner.mockResolvedValue([{ ownerId: userId, conversionRate: 50 }]);
    advancedReports.taskPerformance.mockResolvedValue({ periodFlow: { completedCount: 3 }, current: { overdueCount: 1 }, byAssignee: [{ userId, onTimeCompletionRate: 67 }] });
    advancedReports.meetingPerformance.mockResolvedValue({ summary: { completedCount: 2 }, byOrganizer: [{ organizerId: userId, executionRate: 67 }] });

    const result = await service.call('get_sales_rep_performance', { userId, startDate: '2026-09-01', endDate: '2026-09-24' }, reportUser) as any;
    expect(result.employee.fullName).toBe('کارشناس نمونه');
    expect(result.sales.pipeline.conversionRate).toBe(50);
    expect(result.tasks.employee.onTimeCompletionRate).toBe(67);
    expect(reports.getUserPerformance).toHaveBeenCalledWith(expect.objectContaining({ userIds: [userId], ownerIds: [userId] }), reportUser);
  });

  it('resolves a performance report directly from a human employee name', async () => {
    const reportUser = { ...user, tenantContext: { permissions: ['report:view'] } } as unknown as CurrentUserPayload;
    const userId = '11111111-1111-4111-8111-111111111111';
    reports.getFilterOptions.mockResolvedValue({ users: [{ id: userId, fullName: 'مهتاب امیری', teamId: 'team-1', teamName: 'فروش', teamCode: 'SALES', role: 'REP' }] });
    reports.getUserPerformance.mockResolvedValue({ period: {}, financialVisible: false, members: [{ user: { id: userId, fullName: 'مهتاب امیری' }, activity: { total: 0, breakdown: [] }, companiesCreated: 0, meetings: 0, tasksCreated: 0, tasksAssigned: { total: 0, completed: 0, incomplete: 0 }, opportunities: { total: 0, active: 0, won: 0, lost: 0 } }] });
    reports.getPipelineByOwner.mockResolvedValue([]);
    advancedReports.taskPerformance.mockResolvedValue({ periodFlow: {}, current: {}, byAssignee: [] });
    advancedReports.meetingPerformance.mockResolvedValue({ summary: {}, byOrganizer: [] });

    const result = await service.call('get_sales_rep_performance', { userId: null, userName: 'مهتاب امیری', startDate: null, endDate: null }, reportUser) as any;
    expect(result.employee).toEqual({ id: userId, fullName: 'مهتاب امیری' });
    expect(reports.getUserPerformance).toHaveBeenCalledWith(expect.objectContaining({ userIds: [userId] }), reportUser);
  });
});
