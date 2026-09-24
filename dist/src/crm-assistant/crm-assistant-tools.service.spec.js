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
    const service = new crm_assistant_tools_service_1.CrmAssistantToolsService(companies, opportunities, tasks, meetings, people, activities, timesheets, leaveRequests);
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
});
//# sourceMappingURL=crm-assistant-tools.service.spec.js.map