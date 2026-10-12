import 'reflect-metadata';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CustomerRole } from '@prisma/client';
import { assertCustomerRequestTransition, allowedCustomerRequestTransitions } from '../src/customer-requests/customer-request-lifecycle';
import { parseCustomerRequestFormSchema, validateCustomerRequestAnswers } from '../src/customer-requests/customer-request-form';
import { CustomerRequestsService } from '../src/customer-requests/customer-requests.service';

const schema = { fields: [
  { key: 'subject', type: 'TEXT', label: 'موضوع', required: true, minLength: 2, maxLength: 20 },
  { key: 'priority', type: 'SELECT', label: 'اولویت', options: [{ value: 'LOW', label: 'کم' }, { value: 'HIGH', label: 'زیاد' }] },
  { key: 'count', type: 'NUMBER', label: 'تعداد', min: 1, max: 5 },
  { key: 'details', type: 'TEXTAREA', label: 'شرح', requiredWhen: { field: 'priority', equals: 'HIGH' } },
  { key: 'hidden', type: 'TEXT', label: 'مخفی', visibleWhen: { field: 'priority', equals: 'LOW' } },
] };

describe('Stage 3 customer request form security', () => {
  it('accepts a controlled schema and valid answers', () => {
    expect(parseCustomerRequestFormSchema(schema).fields).toHaveLength(5);
    expect(validateCustomerRequestAnswers(schema, { subject: 'فعال‌سازی', priority: 'LOW', count: 2, hidden: 'ok' })).toMatchObject({ priority: 'LOW', count: 2 });
  });
  it('allows incomplete drafts but not incomplete submissions', () => {
    expect(validateCustomerRequestAnswers(schema, {}, true)).toEqual({});
    expect(() => validateCustomerRequestAnswers(schema, {})).toThrow(BadRequestException);
  });
  it.each([
    [{ subject: 'ok', unknown: 'x' }, 'unknown key'],
    [{ subject: 'ok', priority: 'INVALID' }, 'invalid option'],
    [{ subject: 'ok', count: 9 }, 'number range'],
    [{ subject: 'ok', priority: 'HIGH' }, 'conditional required'],
    [{ subject: 'ok', priority: 'HIGH', details: 'x', hidden: 'forbidden' }, 'hidden value'],
  ])('rejects unsafe/invalid answers: %s', (answers, _label) => expect(() => validateCustomerRequestAnswers(schema, answers)).toThrow(BadRequestException));
  it('rejects duplicate, unsafe and executable-looking schema keys/types', () => {
    expect(() => parseCustomerRequestFormSchema({ fields: [{ key: '__proto__', type: 'TEXT', label: 'x' }] })).toThrow();
    expect(() => parseCustomerRequestFormSchema({ fields: [{ key: 'x', type: 'SCRIPT', label: 'x' }] })).toThrow();
    expect(() => parseCustomerRequestFormSchema({ fields: [{ key: 'x', type: 'TEXT', label: 'x' }, { key: 'x', type: 'TEXT', label: 'x' }] })).toThrow();
  });
  it('rejects oversized answer payloads', () => expect(() => validateCustomerRequestAnswers({ fields: [{ key: 'x', type: 'TEXT', label: 'x', maxLength: 100000 }] }, { x: 'a'.repeat(70000) })).toThrow());
});

describe('Stage 3 request lifecycle', () => {
  it('allows configured transitions', () => { expect(() => assertCustomerRequestTransition('DRAFT', 'SUBMITTED')).not.toThrow(); expect(allowedCustomerRequestTransitions('RESOLVED')).toEqual(['IN_PROGRESS', 'CLOSED']); });
  it('rejects skipped and terminal transitions', () => { expect(() => assertCustomerRequestTransition('DRAFT', 'CLOSED')).toThrow(BadRequestException); expect(() => assertCustomerRequestTransition('CLOSED', 'IN_PROGRESS')).toThrow(BadRequestException); });
});

describe('Stage 3 company-scoped authorization', () => {
  const principal = { userId: 'u1', email: 'c@example.com', principalType: 'CUSTOMER' as const, organizationId: 'o1', companyId: 'c1', membershipId: 'm1', role: CustomerRole.CUSTOMER_USER };
  function service(overrides: Record<string, unknown> = {}) { const prisma: any = { customerRequestType: { findMany: jest.fn().mockResolvedValue([]) }, customerRequest: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0), findFirst: jest.fn().mockResolvedValue(null) }, customerCompanyMembership: { findFirst: jest.fn().mockResolvedValue(null) }, ...overrides }; return { prisma, value: new CustomerRequestsService(prisma, { record: jest.fn() } as any, {} as any) }; }
  it('scopes catalog by tenant, active company availability, enabled state and publication', async () => { const { value, prisma } = service(); await value.portalCatalog(principal); expect(prisma.customerRequestType.findMany.mock.calls[0][0].where).toMatchObject({ organizationId: 'o1', isEnabled: true, retiredAt: null, currentPublishedVersionId: { not: null } }); expect(JSON.stringify(prisma.customerRequestType.findMany.mock.calls[0][0].where)).toContain('c1'); });
  it('scopes customer-user lists to owned or actively shared requests', async () => { const { value, prisma } = service(); await value.listPortal({}, principal); const where = prisma.customerRequest.findMany.mock.calls[0][0].where; expect(where.organizationId).toBe('o1'); expect(where.companyId).toBe('c1'); expect(JSON.stringify(where)).toContain('m1'); expect(JSON.stringify(where)).toContain('revokedAt'); });
  it('gives customer admins company-wide list visibility', async () => { const { value, prisma } = service(); await value.listPortal({}, { ...principal, role: CustomerRole.CUSTOMER_ADMIN }); const where = prisma.customerRequest.findMany.mock.calls[0][0].where; expect(where.OR).toBeUndefined(); });
  it('returns not found instead of disclosing cross-company IDs', async () => { const { value } = service(); await expect(value.portalDetail('foreign-id', principal)).rejects.toBeInstanceOf(NotFoundException); });
  it('allows only customer admins to manage sharing', async () => { const { value } = service(); await expect(value.listShares('r1', principal)).rejects.toBeInstanceOf(ForbiddenException); });
});
