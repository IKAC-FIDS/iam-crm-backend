"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const globals_1 = require("@jest/globals");
const crm_assistant_tools_service_1 = require("./crm-assistant-tools.service");
(0, globals_1.describe)('CrmAssistantToolsService', () => {
    const companies = { findAll: globals_1.jest.fn() };
    const opportunities = { findAll: globals_1.jest.fn() };
    const tasks = { findAll: globals_1.jest.fn() };
    const meetings = { findAll: globals_1.jest.fn() };
    const people = { findDirectory: globals_1.jest.fn() };
    const activities = { findAll: globals_1.jest.fn() };
    const timesheets = { findMine: globals_1.jest.fn() };
    const leaveRequests = { findMine: globals_1.jest.fn() };
    const reports = { getFilterOptions: globals_1.jest.fn(), getUserPerformance: globals_1.jest.fn(), getPipelineByOwner: globals_1.jest.fn() };
    const advancedReports = { taskPerformance: globals_1.jest.fn(), meetingPerformance: globals_1.jest.fn() };
    const service = new crm_assistant_tools_service_1.CrmAssistantToolsService(companies, opportunities, tasks, meetings, people, activities, timesheets, leaveRequests, reports, advancedReports);
    const user = {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'REP',
        tenantContext: { permissions: ['company:view'] },
    };
    (0, globals_1.beforeEach)(() => { globals_1.jest.clearAllMocks(); });
    (0, globals_1.it)('only exposes tools allowed by tenant permissions', () => {
        (0, globals_1.expect)(service.listFor(user).map((tool) => tool.name)).toEqual(['search_companies']);
    });
    (0, globals_1.it)('rejects calls outside the current permission set', async () => {
        await (0, globals_1.expect)(service.call('search_opportunities', {}, user)).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    (0, globals_1.it)('bounds limits and returns a compact company projection', async () => {
        companies.findAll.mockResolvedValue({
            data: [{ id: 'c1', legalName: 'شرکت نمونه', brandName: null, status: 'ACTIVE', priority: 'HIGH', industry: 'فناوری', owner: null, updatedAt: new Date('2026-09-24') }],
            meta: { total: 1 },
        });
        const result = await service.call('search_companies', { search: ' نمونه ', limit: 999 }, user);
        (0, globals_1.expect)(companies.findAll).toHaveBeenCalledWith(user, { page: 1, limit: 20, search: 'نمونه' }, { search: 'نمونه' });
        (0, globals_1.expect)(result).toMatchObject({ data: [{ id: 'c1', name: 'شرکت نمونه' }], meta: { total: 1 } });
    });
    (0, globals_1.it)('builds a scoped sales-rep performance report from authoritative report services', async () => {
        const reportUser = { ...user, tenantContext: { permissions: ['report:view'] } };
        const userId = '11111111-1111-4111-8111-111111111111';
        reports.getFilterOptions.mockResolvedValue({ users: [{ id: userId, fullName: 'کارشناس نمونه', teamId: null, teamName: null, teamCode: null, role: 'REP' }] });
        reports.getUserPerformance.mockResolvedValue({
            period: { startDate: '2026-09-01', endDate: '2026-09-24' }, financialVisible: false,
            members: [{ user: { id: userId, fullName: 'کارشناس نمونه' }, activity: { total: 5, breakdown: [] }, companiesCreated: 2, meetings: 3, tasksCreated: 4, tasksAssigned: { total: 4, completed: 3, incomplete: 1 }, opportunities: { total: 2, active: 1, won: 1, lost: 0 } }],
        });
        reports.getPipelineByOwner.mockResolvedValue([{ ownerId: userId, conversionRate: 50 }]);
        advancedReports.taskPerformance.mockResolvedValue({ periodFlow: { completedCount: 3 }, current: { overdueCount: 1 }, byAssignee: [{ userId, onTimeCompletionRate: 67 }] });
        advancedReports.meetingPerformance.mockResolvedValue({ summary: { completedCount: 2 }, byOrganizer: [{ organizerId: userId, executionRate: 67 }] });
        const result = await service.call('get_sales_rep_performance', { userId, startDate: '2026-09-01', endDate: '2026-09-24' }, reportUser);
        (0, globals_1.expect)(result.employee.fullName).toBe('کارشناس نمونه');
        (0, globals_1.expect)(result.sales.pipeline.conversionRate).toBe(50);
        (0, globals_1.expect)(result.tasks.employee.onTimeCompletionRate).toBe(67);
        (0, globals_1.expect)(reports.getUserPerformance).toHaveBeenCalledWith(globals_1.expect.objectContaining({ userIds: [userId], ownerIds: [userId] }), reportUser);
    });
    (0, globals_1.it)('resolves a performance report directly from a human employee name', async () => {
        const reportUser = { ...user, tenantContext: { permissions: ['report:view'] } };
        const userId = '11111111-1111-4111-8111-111111111111';
        reports.getFilterOptions.mockResolvedValue({ users: [{ id: userId, fullName: 'مهتاب امیری', teamId: 'team-1', teamName: 'فروش', teamCode: 'SALES', role: 'REP' }] });
        reports.getUserPerformance.mockResolvedValue({ period: {}, financialVisible: false, members: [{ user: { id: userId, fullName: 'مهتاب امیری' }, activity: { total: 0, breakdown: [] }, companiesCreated: 0, meetings: 0, tasksCreated: 0, tasksAssigned: { total: 0, completed: 0, incomplete: 0 }, opportunities: { total: 0, active: 0, won: 0, lost: 0 } }] });
        reports.getPipelineByOwner.mockResolvedValue([]);
        advancedReports.taskPerformance.mockResolvedValue({ periodFlow: {}, current: {}, byAssignee: [] });
        advancedReports.meetingPerformance.mockResolvedValue({ summary: {}, byOrganizer: [] });
        const result = await service.call('get_sales_rep_performance', { userId: null, userName: 'مهتاب امیری', startDate: null, endDate: null }, reportUser);
        (0, globals_1.expect)(result.employee).toEqual({ id: userId, fullName: 'مهتاب امیری' });
        (0, globals_1.expect)(reports.getUserPerformance).toHaveBeenCalledWith(globals_1.expect.objectContaining({ userIds: [userId] }), reportUser);
    });
});
//# sourceMappingURL=crm-assistant-tools.service.spec.js.map