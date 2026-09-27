import { describe, expect, it, jest } from '@jest/globals';
import { CrmAssistantService } from './crm-assistant.service';

describe('CrmAssistantService deterministic performance comparison', () => {
  it('uses conversation context and internal reports without calling an LLM provider', async () => {
    const reports: Record<string, Record<string, unknown>> = {
      'user-mahtab': performanceReport('مهتاب امیری', 16, 3, 19, 118, 100),
      'user-peer': performanceReport('کارشناس هم‌تیم', 10, 1, 10, 80, 75),
    };
    const mcp = {
      listFor: jest.fn().mockReturnValue([
        { name: 'search_report_users' },
        { name: 'get_sales_rep_performance' },
      ]),
      call: jest.fn<(...args: any[]) => Promise<any>>(async (name: string, args: Record<string, string>) => {
        if (name === 'search_report_users') {
          return {
            data: [
              { id: 'user-mahtab', fullName: 'مهتاب امیری', teamId: 'sales', teamName: 'فروش سازمانی' },
              { id: 'user-peer', fullName: 'کارشناس هم‌تیم', teamId: 'sales', teamName: 'فروش سازمانی' },
            ],
          };
        }
        return reports[args.userId];
      }),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({
      message: 'میتونی با کارشناس های فروش دیگه مقایسش کنی؟',
      history: [
        { role: 'user', content: 'یک گزارش از عملکرد مهتاب بده' },
        { role: 'assistant', content: '### گزارش عملکرد مهتاب امیری\nبازه گزارش: ۳۰ روز اخیر' },
      ],
    }, {
      userId: 'admin',
      membershipId: 'membership',
      organizationId: 'organization',
      tenantContext: {
        tenantId: 'organization',
        organizationId: 'organization',
        userId: 'admin',
        membershipId: 'membership',
        membershipStatus: 'active',
        resolutionSource: 'token-session',
        tenantRole: 'ADMIN',
        permissions: ['report:view'],
        platformAdmin: false,
      },
    } as never);

    expect(result.answer).toContain('مقایسه عملکرد مهتاب امیری');
    expect(result.answer).toContain('کارشناس هم‌تیم');
    expect(result.answer).toContain('رتبه');
    expect(result.toolsUsed).toEqual(['search_report_users', 'get_sales_rep_performance']);
    expect(config.get).not.toHaveBeenCalled();
  });
});

function performanceReport(
  fullName: string,
  opportunities: number,
  won: number,
  conversion: number,
  activities: number,
  taskRate: number,
) {
  return {
    period: { startDate: '2026-08-28T00:00:00.000Z', endDate: '2026-09-27T00:00:00.000Z' },
    employee: { fullName },
    sales: { opportunities: { total: opportunities, won }, pipeline: { conversionRate: conversion } },
    activity: { total: activities },
    tasks: { employee: { onTimeCompletionRate: taskRate } },
  };
}
