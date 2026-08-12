"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const organization_memberships_service_1 = require("../organization-memberships/organization-memberships.service");
const safeUserSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    roleId: true,
    assignedRole: { select: { id: true, code: true, name: true, baseRole: true, isSystem: true, isActive: true } },
    team: true,
    teamId: true,
    teamRef: {
        select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
        },
    },
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
const ownerOptionSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    roleId: true,
    teamId: true,
    team: true,
    teamRef: { select: { id: true, code: true, name: true } },
};
let UsersService = class UsersService {
    constructor(prisma, audit, memberships) {
        this.prisma = prisma;
        this.audit = audit;
        this.memberships = memberships;
    }
    async create(dto, actor) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const teamAssignment = await this.resolveTeamAssignment(dto.teamId, dto.team, actor);
        const user = await this.prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    fullName: dto.fullName,
                    email: dto.email,
                    passwordHash,
                    role: dto.role,
                    team: teamAssignment.team,
                    teamId: teamAssignment.teamId,
                    organizationId: actor ? (0, tenant_scope_util_1.getCurrentOrganizationId)(actor) : undefined,
                },
            });
            await this.memberships.createInitialMembership(tx, created);
            return tx.user.findUniqueOrThrow({ where: { id: created.id }, select: safeUserSelect });
        });
        await this.audit.record({
            actorId: actor?.userId,
            entityType: 'user',
            entityId: user.id,
            action: 'user.created',
            after: user,
        });
        return user;
    }
    async findAll(query, actor) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim();
        const and = [
            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(actor) },
        ];
        if (query.role)
            and.push({ role: query.role });
        if (query.teamId)
            and.push({ teamId: query.teamId });
        if (query.team?.trim()) {
            const team = query.team.trim();
            and.push({
                OR: [
                    { team },
                    { teamRef: { code: { equals: team, mode: 'insensitive' } } },
                    { teamRef: { name: { equals: team, mode: 'insensitive' } } },
                ],
            });
        }
        if (query.isActive !== undefined)
            and.push({ isActive: query.isActive });
        if (search) {
            and.push({
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            });
        }
        const where = and.length ? { AND: and } : {};
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: safeUserSelect,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    getOwnerOptions(user) {
        return this.prisma.user.findMany({
            where: {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                isActive: true,
                role: { in: [client_1.UserRole.REP, client_1.UserRole.MANAGER] },
            },
            select: ownerOptionSelect,
            orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
        });
    }
    async findOwnerOptions(user, query) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const search = query.search?.trim();
        if (query.teamId) {
            const team = await this.prisma.team.findFirst({
                where: { id: query.teamId, organizationId, isActive: true },
                select: { id: true },
            });
            if (!team)
                throw new common_1.NotFoundException('Team not found');
        }
        const where = {
            organizationId,
            isActive: true,
            role: { in: [client_1.UserRole.REP, client_1.UserRole.MANAGER] },
            ...(query.teamId && { teamId: query.teamId }),
        };
        if (query.selectedId) {
            where.id = query.selectedId;
        }
        else if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: ownerOptionSelect,
                orderBy: [{ fullName: 'asc' }, { email: 'asc' }, { id: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async findAssigneeOptions(user, query) {
        const page = query.page ?? 1, limit = query.limit ?? 25, search = query.search?.trim();
        const where = { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), isActive: true,
            ...(query.selectedId ? { id: query.selectedId } : search ? { OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {}) };
        const [data, total] = await Promise.all([this.prisma.user.findMany({ where, select: ownerOptionSelect, orderBy: [{ fullName: 'asc' }, { email: 'asc' }], skip: (page - 1) * limit, take: limit }), this.prisma.user.count({ where })]);
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    async findOne(id, actor) {
        const user = await this.prisma.user.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(actor) },
            select: safeUserSelect,
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async deactivate(id, actor) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(actor);
        const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.user.update({
                where: { id },
                data: { isActive: false },
                select: safeUserSelect,
            });
            await this.memberships.suspendForUser(tx, id, organizationId);
            await tx.organization.update({ where: { id: organizationId }, data: { authorizationVersion: { increment: 1 } } });
            return result;
        });
        await this.audit.record({
            actorId: actor.userId,
            organizationId,
            entityType: 'user',
            entityId: id,
            action: 'user.deactivated',
            before: user,
            after: updated,
        });
        return updated;
    }
    async activate(id, actor) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(actor);
        const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.isActive) {
            throw new common_1.BadRequestException('User is already active');
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.user.update({
                where: { id },
                data: { isActive: true },
                select: safeUserSelect,
            });
            await this.memberships.activateForUser(tx, id, organizationId);
            await tx.organization.update({ where: { id: organizationId }, data: { authorizationVersion: { increment: 1 } } });
            return result;
        });
        await this.audit.record({
            actorId: actor.userId,
            organizationId,
            entityType: 'user',
            entityId: id,
            action: 'user.activated',
            before: user,
            after: updated,
        });
        return updated;
    }
    async updateUserRole(id, dto, actor) {
        if (!dto.role && !dto.roleId) {
            throw new common_1.BadRequestException('role or roleId is required');
        }
        const organizationId = actor ? (0, tenant_scope_util_1.getCurrentOrganizationId)(actor) : undefined;
        const user = await this.prisma.user.findFirst({
            where: { id, ...(organizationId && { organizationId }) },
            include: { ownedCompanies: { select: { id: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const assignedRole = dto.roleId
            ? await this.prisma.role.findFirst({ where: { id: dto.roleId, isActive: true }, include: { permissions: { include: { permission: true } } } })
            : null;
        if (dto.roleId && !assignedRole)
            throw new common_1.BadRequestException('Role does not exist or is inactive');
        const nextBaseRole = assignedRole?.baseRole ?? dto.role ?? user.role;
        if (actor?.userId === id && user.role === client_1.UserRole.ADMIN && assignedRole) {
            const actions = new Set(assignedRole.permissions.map((item) => item.permission.action));
            if (!actions.has('permission:manage') || !actions.has('role:manage'))
                throw new common_1.BadRequestException('You cannot remove your own RBAC management access');
        }
        const teamAssignment = await this.resolveTeamAssignment(dto.teamId, dto.team, actor, {
            teamId: user.teamId,
            team: user.team,
        });
        if (nextBaseRole === client_1.UserRole.MANAGER &&
            user.ownedCompanies.length > 0 &&
            !teamAssignment.teamId &&
            !teamAssignment.team) {
            throw new common_1.BadRequestException('A manager with owned companies must have a team');
        }
        const nextRoleId = assignedRole?.id ?? (dto.role ? null : user.roleId);
        const updatedUser = await this.prisma.$transaction(async (tx) => {
            const result = await tx.user.update({
                where: { id },
                data: {
                    role: nextBaseRole,
                    roleId: nextRoleId,
                    team: teamAssignment.team,
                    teamId: teamAssignment.teamId,
                },
                select: safeUserSelect,
            });
            await this.memberships.syncDefaultAssignment(tx, id, user.organizationId, nextRoleId, teamAssignment.teamId);
            await tx.organization.update({ where: { id: user.organizationId }, data: { authorizationVersion: { increment: 1 } } });
            return result;
        });
        permissions_guard_1.PermissionsGuard.clearCache(nextBaseRole);
        if (assignedRole)
            permissions_guard_1.PermissionsGuard.clearCache(`role:${assignedRole.id}`);
        permissions_guard_1.PermissionsGuard.clearCache(user.role);
        await this.audit.record({
            actorId: actor?.userId,
            organizationId,
            entityType: 'user',
            entityId: id,
            action: 'user.role_changed',
            before: user,
            after: updatedUser,
        });
        return updatedUser;
    }
    async resolveTeamAssignment(teamId, legacyTeam, actor, current = {
        teamId: null,
        team: null,
    }) {
        if (teamId !== undefined) {
            if (teamId === null) {
                return {
                    teamId: null,
                    team: legacyTeam !== undefined ? legacyTeam.trim() || null : null,
                };
            }
            const team = await this.prisma.team.findFirst({
                where: {
                    id: teamId,
                    isActive: true,
                    ...(actor && { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(actor) }),
                },
            });
            if (!team) {
                throw new common_1.BadRequestException('Selected team is invalid or inactive');
            }
            return {
                teamId: team.id,
                team: team.code,
            };
        }
        if (legacyTeam !== undefined) {
            return {
                teamId: current.teamId,
                team: legacyTeam.trim() || null,
            };
        }
        return current;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        organization_memberships_service_1.OrganizationMembershipsService])
], UsersService);
//# sourceMappingURL=users.service.js.map