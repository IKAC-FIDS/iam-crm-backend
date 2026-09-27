"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const crm_assistant_service_1 = require("./crm-assistant.service");
(0, globals_1.describe)('CrmAssistantService deterministic performance comparison', () => {
    (0, globals_1.it)('routes the default task-list suggestion to the task MCP tool', async () => {
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([{ name: 'search_tasks' }]),
            call: globals_1.jest.fn().mockResolvedValue({ data: [], meta: { total: 0 } }),
        };
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        await service.ask({ message: 'آخرین ۱۰ کار ثبت‌شده را نشان بده.', history: [] }, currentUser());
        (0, globals_1.expect)(mcp.call).toHaveBeenCalledWith('search_tasks', { search: null, limit: 10 }, globals_1.expect.anything());
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
    globals_1.it.each([
        'لیست فرصت های پرتو داچک رو بده',
        'فهرست فرصت‌های شرکت پرتو داچک را بده',
        'فرصت‌های مربوط به شرکت پرتو داچک را نمایش بده',
        'فرصت‌های فروش برای پرتو داچک رو نشان بده',
    ])('passes the company filter from opportunity-list wording to MCP search: %s', async (message) => {
        const opportunityResult = { data: [{ id: 'opportunity-1', title: 'خرید توکن فایدو', company: 'پرتو داچک' }], meta: { total: 1 } };
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([{ name: 'search_opportunities' }]),
            call: globals_1.jest.fn().mockResolvedValue(opportunityResult),
        };
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        const result = await service.ask({ message, history: [] }, currentUser());
        (0, globals_1.expect)(mcp.call).toHaveBeenCalledWith('search_opportunities', { search: 'پرتو داچک', limit: 10 }, globals_1.expect.anything());
        (0, globals_1.expect)(result.answer).toContain('فرصت‌های فروش مرتبط با «پرتو داچک»');
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('returns the requested recent company list as structured MCP data without an LLM provider', async () => {
        const companyResult = {
            data: Array.from({ length: 10 }, (_, index) => ({ id: `company-${index}`, name: `شرکت ${index + 1}`, status: 'ACTIVE' })),
            meta: { total: 25, limit: 10 },
        };
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([{ name: 'search_companies' }]),
            call: globals_1.jest.fn().mockResolvedValue(companyResult),
        };
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        const result = await service.ask({ message: 'لیست ده شرکت آخر سیستم رو بده', history: [] }, currentUser());
        (0, globals_1.expect)(mcp.call).toHaveBeenCalledWith('search_companies', { search: null, limit: 10 }, globals_1.expect.anything());
        (0, globals_1.expect)(result.answer).toContain('آخرین ۱۰ شرکت');
        (0, globals_1.expect)(result.toolData).toEqual([{ tool: 'search_companies', data: companyResult }]);
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('finds meetings by organizer or assignee name instead of searching meeting titles', async () => {
        const userId = '22222222-2222-4222-8222-222222222222';
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([{ name: 'search_meeting_users' }, { name: 'get_user_meetings' }]),
            call: globals_1.jest.fn(async (name, args) => {
                if (name === 'search_meeting_users') {
                    (0, globals_1.expect)(args.search).toBe('اسدی');
                    return { data: [{ id: userId, fullName: 'مرتضی اسدی', teamName: 'فنی نشانه' }] };
                }
                (0, globals_1.expect)(args.userId).toBe(userId);
                return { data: [{ title: 'دیدار دوستانه', startAt: '2026-10-04T05:00:00.000Z', company: 'رهسا', status: 'SCHEDULED', involvement: 'ASSIGNEE' }] };
            }),
        };
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        const result = await service.ask({ message: 'جلسات آقای اسدی رو بهم میگی؟', history: [] }, currentUser());
        (0, globals_1.expect)(result.answer).toContain('جلسات مرتضی اسدی');
        (0, globals_1.expect)(result.answer).toContain('دیدار دوستانه');
        (0, globals_1.expect)(result.answer).toContain('مسئول');
        (0, globals_1.expect)(result.toolsUsed).toEqual(['search_meeting_users', 'get_user_meetings']);
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('answers a meeting-participants follow-up through MCP tools without an LLM provider', async () => {
        const meetingId = '11111111-1111-4111-8111-111111111111';
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([{ name: 'search_meetings' }, { name: 'get_meeting_details' }]),
            call: globals_1.jest.fn(async (name) => name === 'search_meetings'
                ? { data: [{ id: meetingId, title: 'دیدار دوستانه', startAt: '2026-10-04T05:00:00.000Z' }] }
                : {
                    id: meetingId,
                    title: 'دیدار دوستانه',
                    organizer: { name: 'فرزاد نوروزی فرد' },
                    assignees: [{ name: 'مهتاب امیری' }],
                    attendees: [{ name: 'مخاطب نمونه', title: 'مدیرعامل' }],
                }),
        };
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        const result = await service.ask({
            message: 'شرکت کنندگان جلسه چه کسانی هستن؟',
            history: [{
                    role: 'assistant',
                    content: '| تاریخ و زمان شروع (UTC) | عنوان جلسه | شرکت | برگزارکننده | وضعیت |\n|---|---|---|---|---|\n| 2026-10-04 | دیدار دوستانه | رهسا | فرزاد نوروزی فرد | SCHEDULED |',
                }],
        }, currentUser());
        (0, globals_1.expect)(result.answer).toContain('شرکت‌کنندگان جلسه دیدار دوستانه');
        (0, globals_1.expect)(result.answer).toContain('فرزاد نوروزی فرد');
        (0, globals_1.expect)(result.answer).toContain('مخاطب نمونه');
        (0, globals_1.expect)(result.toolsUsed).toEqual(['search_meetings', 'get_meeting_details']);
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('creates a confirmation proposal for a task without calling an LLM provider', async () => {
        const proposal = { token: 'signed-token', actionType: 'task.create', title: 'ایجاد کار' };
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([
                { name: 'search_assignment_users' },
                { name: 'propose_create_task' },
            ]),
            call: globals_1.jest.fn(async (name, args) => {
                if (name === 'search_assignment_users') {
                    return { data: [{ id: 'farzad-id', fullName: 'فرزاد نوروزی فرد', teamName: 'فنی نشانه' }] };
                }
                (0, globals_1.expect)(args).toMatchObject({ title: 'تهیه مستندات sso', assignedToId: 'farzad-id' });
                return proposal;
            }),
        };
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        const result = await service.ask({
            message: 'میتونی یک کار جدید برای فرزاد نوروزی فرد برای تهیه مستندات sso بسازی؟',
            history: [],
        }, currentUser());
        (0, globals_1.expect)(result.answer).toContain('پیش‌نویس کار «تهیه مستندات sso»');
        (0, globals_1.expect)(result.pendingActions).toEqual([proposal]);
        (0, globals_1.expect)(result.toolsUsed).toEqual(['search_assignment_users', 'propose_create_task']);
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('uses conversation context and internal reports without calling an LLM provider', async () => {
        const reports = {
            'user-mahtab': performanceReport('مهتاب امیری', 16, 3, 19, 118, 100),
            'user-peer': performanceReport('کارشناس هم‌تیم', 10, 1, 10, 80, 75),
        };
        const mcp = {
            listFor: globals_1.jest.fn().mockReturnValue([
                { name: 'search_report_users' },
                { name: 'get_sales_rep_performance' },
            ]),
            call: globals_1.jest.fn(async (name, args) => {
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
        const audit = { recordTenantEvent: globals_1.jest.fn().mockResolvedValue(undefined) };
        const config = { get: globals_1.jest.fn().mockReturnValue(undefined) };
        const service = new crm_assistant_service_1.CrmAssistantService(config, mcp, audit);
        const result = await service.ask({
            message: 'میتونی با کارشناس های فروش دیگه مقایسش کنی؟',
            history: [
                { role: 'user', content: 'یک گزارش از عملکرد مهتاب بده' },
                { role: 'assistant', content: '### گزارش عملکرد مهتاب امیری\nبازه گزارش: ۳۰ روز اخیر' },
            ],
        }, currentUser());
        (0, globals_1.expect)(result.answer).toContain('مقایسه عملکرد مهتاب امیری');
        (0, globals_1.expect)(result.answer).toContain('کارشناس هم‌تیم');
        (0, globals_1.expect)(result.answer).toContain('رتبه');
        (0, globals_1.expect)(result.toolsUsed).toEqual(['search_report_users', 'get_sales_rep_performance']);
        (0, globals_1.expect)(config.get).not.toHaveBeenCalled();
    });
});
function currentUser() {
    return {
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
            permissions: ['report:view', 'task:create', 'meeting:view'],
            platformAdmin: false,
        },
    };
}
function performanceReport(fullName, opportunities, won, conversion, activities, taskRate) {
    return {
        period: { startDate: '2026-08-28T00:00:00.000Z', endDate: '2026-09-27T00:00:00.000Z' },
        employee: { fullName },
        sales: { opportunities: { total: opportunities, won }, pipeline: { conversionRate: conversion } },
        activity: { total: activities },
        tasks: { employee: { onTimeCompletionRate: taskRate } },
    };
}
//# sourceMappingURL=crm-assistant.service.spec.js.map