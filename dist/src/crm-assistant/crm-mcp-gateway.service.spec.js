"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const crm_mcp_gateway_service_1 = require("./crm-mcp-gateway.service");
(0, globals_1.describe)('CrmMcpGatewayService', () => {
    const user = { userId: 'user-1' };
    (0, globals_1.it)('combines the permission-filtered read and action catalogs', () => {
        const tools = { listFor: globals_1.jest.fn().mockReturnValue([{ name: 'search_companies' }]) };
        const actions = { listFor: globals_1.jest.fn().mockReturnValue([{ name: 'propose_create_company' }]) };
        const service = new crm_mcp_gateway_service_1.CrmMcpGatewayService(tools, actions);
        (0, globals_1.expect)(service.listFor(user).map((item) => item.name)).toEqual([
            'search_companies',
            'propose_create_company',
        ]);
    });
    (0, globals_1.it)('routes reads to tenant-aware tools and writes to confirmation proposals', async () => {
        const tools = { call: globals_1.jest.fn().mockResolvedValue({ data: [] }) };
        const actions = { propose: globals_1.jest.fn().mockResolvedValue({ token: 'signed-preview' }) };
        const service = new crm_mcp_gateway_service_1.CrmMcpGatewayService(tools, actions);
        await (0, globals_1.expect)(service.call('search_companies', { search: null, limit: 5 }, user))
            .resolves.toEqual({ data: [] });
        await (0, globals_1.expect)(service.call('propose_create_company', { legalName: 'نمونه' }, user))
            .resolves.toEqual({ token: 'signed-preview' });
        (0, globals_1.expect)(tools.call).toHaveBeenCalledWith('search_companies', { search: null, limit: 5 }, user);
        (0, globals_1.expect)(actions.propose).toHaveBeenCalledWith('propose_create_company', { legalName: 'نمونه' }, user);
    });
});
//# sourceMappingURL=crm-mcp-gateway.service.spec.js.map