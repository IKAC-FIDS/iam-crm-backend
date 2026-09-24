"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const globals_1 = require("@jest/globals");
const crm_assistant_actions_service_1 = require("./crm-assistant-actions.service");
const user = {
    userId: '11111111-1111-4111-8111-111111111111', email: 'user@example.com', role: 'REP',
    activeOrganizationId: '22222222-2222-4222-8222-222222222222', membershipId: '33333333-3333-4333-8333-333333333333',
    tenantContext: {
        tenantId: '22222222-2222-4222-8222-222222222222', organizationId: '22222222-2222-4222-8222-222222222222',
        userId: '11111111-1111-4111-8111-111111111111', membershipId: '33333333-3333-4333-8333-333333333333', tenantRole: 'REP',
        permissions: ['company:create', 'opportunity:create', 'task:create'], platformAdmin: false,
        membershipStatus: 'active', resolutionSource: 'token-session',
    },
};
(0, globals_1.describe)('CrmAssistantActionsService', () => {
    const companies = { create: globals_1.jest.fn() };
    const opportunities = { create: globals_1.jest.fn() };
    const tasks = { create: globals_1.jest.fn() };
    const audit = { recordTenantEvent: globals_1.jest.fn() };
    const config = { get: globals_1.jest.fn((key) => key === 'ASSISTANT_ACTION_SECRET' ? 'test-secret-with-enough-entropy' : undefined) };
    let service;
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        service = new crm_assistant_actions_service_1.CrmAssistantActionsService(config, companies, opportunities, tasks, audit);
    });
    (0, globals_1.it)('only exposes action tools covered by effective permissions', () => {
        (0, globals_1.expect)(service.listFor({ ...user, tenantContext: { ...user.tenantContext, permissions: ['task:create'] } }).map((item) => item.name))
            .toEqual(['propose_create_task']);
        (0, globals_1.expect)(service.propose('propose_create_company', { legalName: 'آزمون' }, { ...user, tenantContext: { ...user.tenantContext, permissions: [] } }))
            .rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
    (0, globals_1.it)('creates only after confirmation and rejects token replay', async () => {
        companies.create.mockResolvedValue({ id: '44444444-4444-4444-8444-444444444444', legalName: 'شرکت آزمون', brandName: null });
        const proposal = await service.propose('propose_create_company', { legalName: 'شرکت آزمون', priority: 'HIGH' }, user);
        (0, globals_1.expect)(companies.create).not.toHaveBeenCalled();
        const result = await service.confirm(proposal.token, user);
        (0, globals_1.expect)(result.entity.label).toBe('شرکت آزمون');
        (0, globals_1.expect)(companies.create).toHaveBeenCalledTimes(1);
        await (0, globals_1.expect)(service.confirm(proposal.token, user)).rejects.toBeInstanceOf(common_1.ConflictException);
    });
    (0, globals_1.it)('binds confirmation tokens to the proposing user and organization session', async () => {
        const proposal = await service.propose('propose_create_task', { title: 'پیگیری مشتری' }, user);
        await (0, globals_1.expect)(service.confirm(proposal.token, { ...user, userId: '55555555-5555-4555-8555-555555555555' }))
            .rejects.toBeInstanceOf(common_1.UnauthorizedException);
        (0, globals_1.expect)(tasks.create).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=crm-assistant-actions.service.spec.js.map