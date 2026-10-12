import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthSessionAudience, CustomerMembershipStatus, CustomerRole, UserPrincipalType } from '@prisma/client';
import { CustomerAccessService } from '../src/customer-access/customer-access.service';
import { CustomerUsersService } from '../src/customer-users/customer-users.service';
import { RefreshTokenService } from '../src/auth/refresh-token.service';
import { createHash } from 'node:crypto';

describe('customer portal security boundary', () => {
  it('resolves only an active membership whose company portal is enabled', async () => {
    const prisma = { customerCompanyMembership: { findFirst: jest.fn().mockResolvedValue({ id: 'm1', userId: 'u1', organizationId: 'o1', companyId: 'c1', role: CustomerRole.CUSTOMER_ADMIN, user: { email: 'customer@example.com' }, company: { id: 'c1', organizationId: 'o1', portalEnabled: true } }) } } as any;
    const service = new CustomerAccessService(prisma);
    await expect(service.resolve('u1', 'm1')).resolves.toMatchObject({ id: 'm1', companyId: 'c1' });
    expect(prisma.customerCompanyMembership.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'u1', id: 'm1', status: CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } }) }));
  });

  it('fails closed when an active portal membership is no longer authoritative', async () => {
    const service = new CustomerAccessService({ customerCompanyMembership: { findFirst: jest.fn().mockResolvedValue(null) } } as any);
    await expect(service.resolve('u1', 'm1')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a portal refresh token in the internal audience', async () => {
    const token = 'opaque-token';
    const hash = createHash('sha256').update(token).digest('hex');
    const prisma = { refreshSession: { findUnique: jest.fn().mockResolvedValue({ id: 's1', userId: 'u1', refreshTokenHash: hash, audience: AuthSessionAudience.PORTAL, revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { id: 'u1', isActive: true } }) } } as any;
    const service = new RefreshTokenService(prisma, { get: jest.fn() } as any);
    await expect(service.getActiveSession(token, AuthSessionAudience.INTERNAL)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects invitations for an email owned by an internal principal', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue({ id: 'internal', principalType: UserPrincipalType.INTERNAL }) } } as any;
    const access = { assertCompany: jest.fn().mockResolvedValue({ id: 'c1', portalEnabled: true, legalName: 'Company' }) } as any;
    const service = new CustomerUsersService(prisma, access, {} as any, {} as any, {} as any);
    await expect(service.invite('c1', 'o1', 'Same@Example.com', CustomerRole.CUSTOMER_ADMIN, 'actor')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { normalizedEmail: 'same@example.com' } });
  });

  it('prevents removing the final active customer admin', async () => {
    const membership = { id: 'm1', companyId: 'c1', organizationId: 'o1', userId: 'u1', role: CustomerRole.CUSTOMER_ADMIN, status: CustomerMembershipStatus.ACTIVE, activatedAt: new Date() };
    const tx = { customerCompanyMembership: { count: jest.fn().mockResolvedValue(0) } };
    const prisma = { customerCompanyMembership: { findFirst: jest.fn().mockResolvedValue(membership) }, $transaction: jest.fn((fn: any) => fn(tx)) } as any;
    const service = new CustomerUsersService(prisma, {} as any, {} as any, {} as any, {} as any);
    await expect(service.updateMembership('c1', 'o1', 'm1', { role: CustomerRole.CUSTOMER_USER }, 'actor')).rejects.toBeInstanceOf(ConflictException);
  });
});
