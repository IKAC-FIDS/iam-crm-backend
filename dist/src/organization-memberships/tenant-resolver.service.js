"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TenantResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantResolverService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const node_cache_1 = __importDefault(require("node-cache"));
const permissionCache = new node_cache_1.default({ stdTTL: 600, useClones: false });
let TenantResolverService = TenantResolverService_1 = class TenantResolverService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
        this.logger = new common_1.Logger(TenantResolverService_1.name);
        this.membershipInclude = {
            organization: { select: { id: true, status: true, authorizationVersion: true } },
            role: { select: { id: true, baseRole: true, isActive: true, scope: true, organizationId: true } },
            team: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    isActive: true,
                    organizationId: true,
                },
            },
        };
    }
    async resolveAuthenticatedTenant(userId, options = {}) {
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
            throw new common_1.UnauthorizedException('Invalid authenticated session');
        }
        const activeOrganizationId = options.claims?.activeOrganizationId ?? null;
        const membershipId = options.claims?.membershipId ?? null;
        if (Boolean(activeOrganizationId) !== Boolean(membershipId)) {
            await this.recordRejection('PARTIAL_TENANT_CLAIMS', userId, options.requestId);
            throw new common_1.UnauthorizedException('Invalid tenant session context');
        }
        if (activeOrganizationId && membershipId) {
            const membership = await this.findMembership(membershipId);
            return this.buildContext(user, membership, activeOrganizationId, 'token-session', options.requestId);
        }
        const memberships = await this.prisma.organizationMembership.findMany({
            where: {
                userId,
                status: client_1.OrganizationMembershipStatus.ACTIVE,
                organization: { status: client_1.OrganizationStatus.ACTIVE },
            },
            include: this.membershipInclude,
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        });
        const defaults = memberships.filter((membership) => membership.isDefault);
        if (defaults.length > 1 || (defaults.length === 0 && memberships.length > 1)) {
            await this.recordRejection('AMBIGUOUS_ACTIVE_MEMBERSHIPS', userId, options.requestId);
            throw new common_1.ForbiddenException('Tenant selection is required');
        }
        const selected = defaults[0] ?? (memberships.length === 1 ? memberships[0] : null);
        if (!selected) {
            await this.recordRejection('NO_ACTIVE_MEMBERSHIP', userId, options.requestId);
            throw new common_1.ForbiddenException('No active organization membership');
        }
        this.logger.warn(`Tenant compatibility resolution used userId=${userId} membershipId=${selected.id} requestId=${options.requestId ?? 'none'}`);
        await this.audit.record({
            actorId: userId,
            organizationId: selected.organizationId,
            entityType: 'organization-membership',
            entityId: selected.id,
            action: 'tenant.compatibility-resolved',
            requestId: options.requestId,
            metadata: { source: 'active-default-or-sole-membership' },
        });
        return this.buildContext(user, selected, selected.organizationId, 'migration-compatibility', options.requestId);
    }
    async selectTenant(userId, organizationId, requestId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, isActive: true, role: true },
        });
        if (!user?.isActive) {
            await this.recordRejection('SWITCH_INACTIVE_USER', userId, requestId);
            throw new common_1.ForbiddenException('Tenant selection is not permitted');
        }
        const membership = await this.prisma.organizationMembership.findUnique({
            where: { userId_organizationId: { userId, organizationId } },
            include: this.membershipInclude,
        });
        try {
            return await this.buildContext(user, membership, organizationId, 'explicit-selection', requestId);
        }
        catch {
            await this.recordRejection('SWITCH_NOT_ELIGIBLE', userId, requestId);
            throw new common_1.ForbiddenException('Tenant selection is not permitted');
        }
    }
    findMembership(membershipId) {
        return this.prisma.organizationMembership.findUnique({
            where: { id: membershipId },
            include: this.membershipInclude,
        });
    }
    async buildContext(user, membership, organizationId, source, requestId) {
        if (!membership ||
            membership.userId !== user.id ||
            membership.organizationId !== organizationId ||
            membership.status !== client_1.OrganizationMembershipStatus.ACTIVE ||
            !membership.organization ||
            membership.organization.status !== client_1.OrganizationStatus.ACTIVE) {
            await this.recordRejection('INVALID_TENANT_MEMBERSHIP', user.id, requestId);
            throw new common_1.UnauthorizedException('Invalid tenant session context');
        }
        if (membership.role && !membership.role.isActive) {
            await this.recordRejection('INACTIVE_MEMBERSHIP_ROLE', user.id, requestId);
            throw new common_1.UnauthorizedException('Invalid tenant session context');
        }
        if (!membership.roleId || !membership.role) {
            await this.recordRejection('MISSING_MEMBERSHIP_ROLE', user.id, requestId);
            throw new common_1.UnauthorizedException('Invalid tenant session context');
        }
        if ((membership.role.scope === 'TENANT' && membership.role.organizationId !== membership.organizationId) ||
            (membership.role.scope === 'SYSTEM' && membership.role.organizationId !== null)) {
            await this.recordRejection('CROSS_TENANT_MEMBERSHIP_ROLE', user.id, requestId);
            throw new common_1.UnauthorizedException('Invalid tenant session context');
        }
        if (membership.team &&
            (!membership.team.isActive ||
                membership.team.organizationId !== membership.organizationId)) {
            await this.recordRejection('INVALID_MEMBERSHIP_TEAM', user.id, requestId);
            throw new common_1.UnauthorizedException('Invalid tenant session context');
        }
        const role = membership.role.baseRole;
        const cacheKey = `tenant-authz:${membership.organizationId}:${user.id}:${membership.id}:${membership.organization.authorizationVersion}`;
        let permissions = permissionCache.get(cacheKey);
        if (!permissions) {
            const permissionRows = await this.prisma.rolePermission.findMany({
                where: { roleId: membership.roleId, permission: { isActive: true } },
                select: { permission: { select: { action: true } } },
            });
            permissions = [...new Set(permissionRows.map((row) => row.permission.action))];
            permissionCache.set(cacheKey, permissions);
        }
        return {
            tenantId: membership.organizationId,
            organizationId: membership.organizationId,
            userId: user.id,
            membershipId: membership.id,
            tenantRole: role,
            permissions,
            authorizationVersion: membership.organization.authorizationVersion,
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
    async recordRejection(reason, userId, requestId) {
        this.logger.warn(`Tenant resolution rejected reason=${reason} userId=${userId} requestId=${requestId ?? 'none'}`);
        try {
            await this.audit.record({
                actorId: userId,
                entityType: 'tenant-session',
                action: 'tenant.resolution-rejected',
                requestId,
                metadata: { reason },
            });
        }
        catch (error) {
            this.logger.error(`Tenant rejection audit failed requestId=${requestId ?? 'none'}`, error instanceof Error ? error.stack : undefined);
        }
    }
};
exports.TenantResolverService = TenantResolverService;
exports.TenantResolverService = TenantResolverService = TenantResolverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], TenantResolverService);
//# sourceMappingURL=tenant-resolver.service.js.map