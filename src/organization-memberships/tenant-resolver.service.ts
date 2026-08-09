import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  OrganizationMembershipStatus,
  OrganizationStatus,
  UserRole,
} from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import type {
  TenantContext,
  TenantResolutionSource,
} from '../common/tenant/tenant-context.types';
import { PrismaService } from '../prisma/prisma.service';

export interface TenantClaimPair {
  activeOrganizationId?: string | null;
  membershipId?: string | null;
}

export interface ResolvedTenantContext extends TenantContext {
  readonly role: UserRole;
  readonly roleId: string | null;
  readonly team: string | null;
  readonly teamId: string | null;
  readonly teamCode: string | null;
  readonly teamName: string | null;
}

type ResolutionOptions = {
  claims?: TenantClaimPair;
  requestId?: string | null;
};

type MembershipRow = Awaited<ReturnType<TenantResolverService['findMembership']>>;

@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async resolveAuthenticatedTenant(
    userId: string,
    options: ResolutionOptions = {},
  ): Promise<ResolvedTenantContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isActive: true,
        role: true,
      },
    });

    if (!user?.isActive) {
      await this.recordRejection('INACTIVE_OR_MISSING_USER', userId, options.requestId);
      throw new UnauthorizedException('Invalid authenticated session');
    }

    const activeOrganizationId = options.claims?.activeOrganizationId ?? null;
    const membershipId = options.claims?.membershipId ?? null;
    if (Boolean(activeOrganizationId) !== Boolean(membershipId)) {
      await this.recordRejection('PARTIAL_TENANT_CLAIMS', userId, options.requestId);
      throw new UnauthorizedException('Invalid tenant session context');
    }

    if (activeOrganizationId && membershipId) {
      const membership = await this.findMembership(membershipId);
      return this.buildContext(
        user,
        membership,
        activeOrganizationId,
        'token-session',
        options.requestId,
      );
    }

    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        userId,
        status: OrganizationMembershipStatus.ACTIVE,
        organization: { status: OrganizationStatus.ACTIVE },
      },
      include: this.membershipInclude,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const defaults = memberships.filter((membership) => membership.isDefault);
    if (defaults.length > 1 || (defaults.length === 0 && memberships.length > 1)) {
      await this.recordRejection('AMBIGUOUS_ACTIVE_MEMBERSHIPS', userId, options.requestId);
      throw new ForbiddenException('Tenant selection is required');
    }
    const selected = defaults[0] ?? (memberships.length === 1 ? memberships[0] : null);
    if (!selected) {
      await this.recordRejection('NO_ACTIVE_MEMBERSHIP', userId, options.requestId);
      throw new ForbiddenException('No active organization membership');
    }

    this.logger.warn(
      `Tenant compatibility resolution used userId=${userId} membershipId=${selected.id} requestId=${options.requestId ?? 'none'}`,
    );
    await this.audit.record({
      actorId: userId,
      organizationId: selected.organizationId,
      entityType: 'organization-membership',
      entityId: selected.id,
      action: 'tenant.compatibility-resolved',
      requestId: options.requestId,
      metadata: { source: 'active-default-or-sole-membership' },
    });
    return this.buildContext(
      user,
      selected,
      selected.organizationId,
      'migration-compatibility',
      options.requestId,
    );
  }

  async selectTenant(
    userId: string,
    organizationId: string,
    requestId?: string | null,
  ): Promise<ResolvedTenantContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, role: true },
    });
    if (!user?.isActive) {
      await this.recordRejection('SWITCH_INACTIVE_USER', userId, requestId);
      throw new ForbiddenException('Tenant selection is not permitted');
    }

    const membership = await this.prisma.organizationMembership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: this.membershipInclude,
    });
    try {
      return await this.buildContext(
        user,
        membership,
        organizationId,
        'explicit-selection',
        requestId,
      );
    } catch {
      await this.recordRejection('SWITCH_NOT_ELIGIBLE', userId, requestId);
      throw new ForbiddenException('Tenant selection is not permitted');
    }
  }

  private readonly membershipInclude = {
    organization: { select: { id: true, status: true } },
    role: { select: { id: true, baseRole: true, isActive: true } },
    team: {
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        organizationId: true,
      },
    },
  } as const;

  private findMembership(membershipId: string) {
    return this.prisma.organizationMembership.findUnique({
      where: { id: membershipId },
      include: this.membershipInclude,
    });
  }

  private async buildContext(
    user: { id: string; isActive: boolean; role: UserRole },
    membership: MembershipRow,
    organizationId: string,
    source: TenantResolutionSource,
    requestId?: string | null,
  ): Promise<ResolvedTenantContext> {
    if (
      !membership ||
      membership.userId !== user.id ||
      membership.organizationId !== organizationId ||
      membership.status !== OrganizationMembershipStatus.ACTIVE ||
      !membership.organization ||
      membership.organization.status !== OrganizationStatus.ACTIVE
    ) {
      await this.recordRejection('INVALID_TENANT_MEMBERSHIP', user.id, requestId);
      throw new UnauthorizedException('Invalid tenant session context');
    }
    if (membership.role && !membership.role.isActive) {
      await this.recordRejection('INACTIVE_MEMBERSHIP_ROLE', user.id, requestId);
      throw new UnauthorizedException('Invalid tenant session context');
    }
    if (
      membership.team &&
      (!membership.team.isActive ||
        membership.team.organizationId !== membership.organizationId)
    ) {
      await this.recordRejection('INVALID_MEMBERSHIP_TEAM', user.id, requestId);
      throw new UnauthorizedException('Invalid tenant session context');
    }

    const role = membership.role?.baseRole ?? user.role;
    const permissionRows = await this.prisma.rolePermission.findMany({
      where: membership.roleId
        ? { roleId: membership.roleId, permission: { isActive: true } }
        : { role, permission: { isActive: true } },
      include: { permission: true },
    });
    const permissions = permissionRows.map((row) => row.permission.action);

    return {
      tenantId: membership.organizationId,
      organizationId: membership.organizationId,
      userId: user.id,
      membershipId: membership.id,
      tenantRole: role,
      permissions,
      platformAdmin: false,
      membershipStatus: 'active',
      resolutionSource: source,
      requestId: requestId ?? null,
      role,
      roleId: membership.roleId,
      team: membership.team?.code ?? null,
      teamId: membership.teamId,
      teamCode: membership.team?.code ?? null,
      teamName: membership.team?.name ?? null,
    };
  }

  private async recordRejection(
    reason: string,
    userId: string,
    requestId?: string | null,
  ) {
    this.logger.warn(
      `Tenant resolution rejected reason=${reason} userId=${userId} requestId=${requestId ?? 'none'}`,
    );
    try {
      await this.audit.record({
        actorId: userId,
        entityType: 'tenant-session',
        action: 'tenant.resolution-rejected',
        requestId,
        metadata: { reason },
      });
    } catch (error) {
      this.logger.error(
        `Tenant rejection audit failed requestId=${requestId ?? 'none'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
