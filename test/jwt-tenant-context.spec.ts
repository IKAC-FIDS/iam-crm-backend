import { UnauthorizedException } from '@nestjs/common';
import { UserPrincipalType, UserRole } from '@prisma/client';
import { JwtStrategy } from '../src/auth/jwt.strategy';

describe('JwtStrategy Tenant boundary', () => {
  it('passes only signed Tenant claims to the resolver and ignores spoofable headers', async () => {
    const resolver = {
      resolveAuthenticatedTenant: jest.fn().mockResolvedValue({
        organizationId: 'org-a',
        membershipId: 'membership-a',
        role: UserRole.MANAGER,
        roleId: 'role-a',
        team: null,
        teamId: null,
        teamCode: null,
        teamName: null,
        resolutionSource: 'token-session',
        permissions: ['company:view'],
      }),
    };
    const strategy = new JwtStrategy(
      { get: jest.fn().mockReturnValue('test-secret') } as any,
      resolver as any,
      { setOrganizationId: jest.fn() } as any,
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            principalType: UserPrincipalType.INTERNAL,
          }),
        },
      } as any,
    );
    const req = {
      requestId: 'request-1',
      headers: {
        host: 'tenant-b.example.test',
        'x-forwarded-host': 'tenant-b.example.test',
        'x-tenant': 'org-b',
      },
      body: { organizationId: 'org-b' },
      query: { organizationId: 'org-b' },
      params: { organizationId: 'org-b' },
    } as any;
    const result = await strategy.validate(req, {
      sub: 'user-a',
      email: 'user@example.test',
      role: UserRole.MANAGER,
      organizationId: 'legacy-org',
      activeOrganizationId: 'org-a',
      membershipId: 'membership-a',
    });
    expect(resolver.resolveAuthenticatedTenant).toHaveBeenCalledWith('user-a', {
      claims: {
        activeOrganizationId: 'org-a',
        membershipId: 'membership-a',
      },
      requestId: 'request-1',
    });
    expect(result).toMatchObject({
      organizationId: 'org-a',
      activeOrganizationId: 'org-a',
      membershipId: 'membership-a',
    });
  });

  it('rejects a customer principal at the internal JWT strategy boundary', async () => {
    const resolver = { resolveAuthenticatedTenant: jest.fn() };
    const strategy = new JwtStrategy(
      { get: jest.fn().mockReturnValue('test-secret') } as any,
      resolver as any,
      { setOrganizationId: jest.fn(), setActor: jest.fn() } as any,
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            principalType: UserPrincipalType.CUSTOMER,
          }),
        },
      } as any,
    );

    await expect(
      strategy.validate({ headers: {} } as any, {
        sub: 'customer-a',
        email: 'customer@example.test',
        role: UserRole.REP,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(resolver.resolveAuthenticatedTenant).not.toHaveBeenCalled();
  });
});
