import { describe, expect, it, jest } from '@jest/globals';
import { CrmMcpGatewayService } from './crm-mcp-gateway.service';

describe('CrmMcpGatewayService', () => {
  const user = { userId: 'user-1' } as never;

  it('combines the permission-filtered read and action catalogs', () => {
    const tools = { listFor: jest.fn().mockReturnValue([{ name: 'search_companies' }]) };
    const actions = { listFor: jest.fn().mockReturnValue([{ name: 'propose_create_company' }]) };
    const service = new CrmMcpGatewayService(tools as never, actions as never);

    expect(service.listFor(user).map((item) => item.name)).toEqual([
      'search_companies',
      'propose_create_company',
    ]);
  });

  it('routes reads to tenant-aware tools and writes to confirmation proposals', async () => {
    const tools = { call: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ data: [] }) };
    const actions = { propose: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ token: 'signed-preview' }) };
    const service = new CrmMcpGatewayService(tools as never, actions as never);

    await expect(service.call('search_companies', { search: null, limit: 5 }, user))
      .resolves.toEqual({ data: [] });
    await expect(service.call('propose_create_company', { legalName: 'نمونه' }, user))
      .resolves.toEqual({ token: 'signed-preview' });
    expect(tools.call).toHaveBeenCalledWith('search_companies', { search: null, limit: 5 }, user);
    expect(actions.propose).toHaveBeenCalledWith('propose_create_company', { legalName: 'نمونه' }, user);
  });
});
