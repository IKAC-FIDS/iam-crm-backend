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
var OrganizationMembershipsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationMembershipsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganizationMembershipsService = OrganizationMembershipsService_1 = class OrganizationMembershipsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(OrganizationMembershipsService_1.name);
    }
    async resolveEffectiveContext(user) {
        if (!user.isActive) {
            throw new common_1.ForbiddenException('User is inactive');
        }
        const memberships = await this.prisma.organizationMembership.findMany({
            where: { userId: user.id },
            include: {
                organization: { select: { status: true } },
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
            },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        });
        const active = memberships.filter((membership) => membership.status === client_1.OrganizationMembershipStatus.ACTIVE &&
            membership.organization.status === client_1.OrganizationStatus.ACTIVE);
        const defaults = active.filter((membership) => membership.isDefault);
        if (defaults.length > 1) {
            throw new common_1.ForbiddenException('Ambiguous active organization memberships');
        }
        let selected = defaults.length === 1 ? defaults[0] : undefined;
        if (!selected && active.length === 1)
            selected = active[0];
        if (!selected && active.length > 1) {
            const legacyMatches = active.filter((membership) => membership.organizationId === user.organizationId);
            if (legacyMatches.length === 1) {
                selected = legacyMatches[0];
                this.logger.warn(`Membership compatibility selection used userId=${user.id} membershipId=${selected.id}`);
            }
        }
        if (selected) {
            if (selected.team && selected.team.organizationId !== selected.organizationId) {
                throw new common_1.ForbiddenException('Membership team belongs to another organization');
            }
            if (selected.team && !selected.team.isActive) {
                throw new common_1.ForbiddenException('Membership team is inactive');
            }
            if (selected.role && !selected.role.isActive) {
                throw new common_1.ForbiddenException('Membership role is inactive');
            }
            return {
                membershipId: selected.id,
                organizationId: selected.organizationId,
                role: selected.role?.baseRole ?? user.role,
                roleId: selected.roleId,
                team: selected.team?.code ?? user.team,
                teamId: selected.teamId,
                teamCode: selected.team?.code ?? user.team,
                teamName: selected.team?.name ?? null,
                source: 'authenticated-membership',
            };
        }
        if (memberships.length > 0) {
            throw new common_1.ForbiddenException('No active organization membership');
        }
        const legacyOrganization = await this.prisma.organization.findFirst({
            where: { id: user.organizationId, status: client_1.OrganizationStatus.ACTIVE },
            select: { id: true },
        });
        if (!legacyOrganization) {
            throw new common_1.ForbiddenException('No active organization membership');
        }
        const legacyTeam = user.teamId
            ? await this.prisma.team.findFirst({
                where: {
                    id: user.teamId,
                    organizationId: user.organizationId,
                    isActive: true,
                },
                select: { id: true, code: true, name: true },
            })
            : null;
        if (user.teamId && !legacyTeam) {
            throw new common_1.ForbiddenException('Legacy team is invalid or belongs to another organization');
        }
        const legacyRole = user.roleId
            ? await this.prisma.role.findFirst({
                where: { id: user.roleId, isActive: true },
                select: { id: true },
            })
            : null;
        if (user.roleId && !legacyRole) {
            throw new common_1.ForbiddenException('Legacy role is invalid or inactive');
        }
        this.logger.warn(`Legacy membership fallback used userId=${user.id}`);
        return {
            membershipId: null,
            organizationId: user.organizationId,
            role: user.role,
            roleId: user.roleId,
            team: legacyTeam?.code ?? user.team,
            teamId: legacyTeam?.id ?? null,
            teamCode: legacyTeam?.code ?? user.team,
            teamName: legacyTeam?.name ?? null,
            source: 'migration-compatibility',
        };
    }
    async createInitialMembership(tx, user) {
        await this.assertTeamOrganization(tx, user.teamId, user.organizationId);
        return tx.organizationMembership.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId,
                roleId: user.roleId,
                teamId: user.teamId,
                status: client_1.OrganizationMembershipStatus.ACTIVE,
                isDefault: true,
                joinedAt: user.createdAt,
                lastAccessAt: user.lastLoginAt,
                createdAt: user.createdAt,
            },
        });
    }
    async syncDefaultAssignment(tx, userId, organizationId, roleId, teamId) {
        await this.assertTeamOrganization(tx, teamId, organizationId);
        return tx.organizationMembership.update({
            where: { userId_organizationId: { userId, organizationId } },
            data: { roleId, teamId },
        });
    }
    async syncDefaultTeam(tx, userId, organizationId, teamId) {
        await this.assertTeamOrganization(tx, teamId, organizationId);
        return tx.organizationMembership.update({
            where: { userId_organizationId: { userId, organizationId } },
            data: { teamId },
        });
    }
    async suspendForUser(tx, userId, organizationId) {
        await this.assertOwnerCanBeDeactivated(tx, userId, organizationId);
        return tx.organizationMembership.updateMany({
            where: {
                userId,
                organizationId,
                status: client_1.OrganizationMembershipStatus.ACTIVE,
            },
            data: {
                status: client_1.OrganizationMembershipStatus.SUSPENDED,
                isDefault: false,
                suspendedAt: new Date(),
            },
        });
    }
    async assertOwnerCanBeDeactivated(tx, userId, organizationId) {
        await tx.$queryRaw(client_1.Prisma.sql `
      SELECT CAST(pg_advisory_xact_lock(hashtext(${`tenant-owner:${organizationId}`})) AS TEXT) AS "lockResult"
    `);
        const target = await tx.organizationMembership.findFirst({
            where: { userId, organizationId, status: client_1.OrganizationMembershipStatus.ACTIVE, isTenantOwner: true, user: { isActive: true } },
            select: { id: true },
        });
        if (!target)
            return;
        const activeOwners = await tx.organizationMembership.count({
            where: { organizationId, status: client_1.OrganizationMembershipStatus.ACTIVE, isTenantOwner: true, user: { isActive: true } },
        });
        if (activeOwners <= 1)
            throw new common_1.ConflictException('The last active tenant owner cannot be deactivated');
    }
    async activateForUser(tx, userId, organizationId) {
        await tx.organizationMembership.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });
        return tx.organizationMembership.update({
            where: { userId_organizationId: { userId, organizationId } },
            data: {
                status: client_1.OrganizationMembershipStatus.ACTIVE,
                isDefault: true,
                joinedAt: new Date(),
                suspendedAt: null,
            },
        });
    }
    async touchLastAccess(membershipId) {
        if (!membershipId)
            return;
        await this.prisma.organizationMembership.update({
            where: { id: membershipId },
            data: { lastAccessAt: new Date() },
        });
    }
    async assertTeamOrganization(tx, teamId, organizationId) {
        if (!teamId)
            return;
        const team = await tx.team.findFirst({
            where: { id: teamId, organizationId, isActive: true },
            select: { id: true },
        });
        if (!team) {
            throw new common_1.ForbiddenException('Membership team belongs to another organization or is inactive');
        }
    }
};
exports.OrganizationMembershipsService = OrganizationMembershipsService;
exports.OrganizationMembershipsService = OrganizationMembershipsService = OrganizationMembershipsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationMembershipsService);
//# sourceMappingURL=organization-memberships.service.js.map