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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const teamInclude = {
    manager: {
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            team: true,
            teamId: true,
        },
    },
    _count: {
        select: {
            members: true,
        },
    },
};
const memberSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    team: true,
    teamId: true,
    isActive: true,
    teamRef: {
        select: {
            id: true,
            code: true,
            name: true,
        },
    },
};
let TeamsService = class TeamsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(query, user) {
        this.assertCanView(user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim();
        const isActive = query.isActive ?? (query.includeInactive ? undefined : true);
        const where = {
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            ...(isActive !== undefined && { isActive }),
            ...(query.managerId && { managerId: query.managerId }),
            ...(search && {
                OR: [
                    { code: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.team.findMany({
                where,
                include: teamInclude,
                orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.team.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: data.map((team) => this.toTeamResponse(team)),
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
    async findOne(id, user) {
        this.assertCanView(user);
        const team = await this.getTeam(id, user);
        return this.toTeamResponse(team);
    }
    async create(dto, user) {
        this.assertAdmin(user);
        const code = this.normalizeCode(dto.code);
        const duplicate = await this.prisma.team.findUnique({
            where: { code },
        });
        if (duplicate) {
            throw new common_1.ConflictException('Team code already exists');
        }
        const manager = dto.managerId
            ? await this.getValidManager(dto.managerId, user)
            : null;
        const team = await this.prisma.team.create({
            data: {
                code,
                name: this.requiredText(dto.name, 'Team name is required'),
                description: dto.description?.trim() || undefined,
                managerId: manager?.id,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            include: teamInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'team',
            entityId: team.id,
            action: 'team.created',
            after: team,
        });
        return this.toTeamResponse(team);
    }
    async update(id, dto, user) {
        this.assertAdmin(user);
        const current = await this.getTeam(id, user);
        const data = {};
        if (dto.code !== undefined) {
            const code = this.normalizeCode(dto.code);
            const duplicate = await this.prisma.team.findUnique({ where: { code } });
            if (duplicate && duplicate.id !== id) {
                throw new common_1.ConflictException('Team code already exists');
            }
            data.code = code;
        }
        if (dto.name !== undefined) {
            data.name = this.requiredText(dto.name, 'Team name is required');
        }
        if (dto.description !== undefined) {
            data.description = dto.description?.trim() || null;
        }
        if (dto.managerId !== undefined) {
            data.manager = dto.managerId
                ? { connect: { id: (await this.getValidManager(dto.managerId, user)).id } }
                : { disconnect: true };
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        const updated = await this.prisma.team.update({
            where: { id },
            data,
            include: teamInclude,
        });
        if (dto.code !== undefined && updated.code !== current.code) {
            await this.syncLegacyTeamForMembers(updated.id, updated.code);
        }
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'team',
            entityId: id,
            action: 'team.updated',
            before: current,
            after: updated,
        });
        return this.toTeamResponse(updated);
    }
    async activate(id, user) {
        return this.update(id, { isActive: true }, user);
    }
    async deactivate(id, user) {
        return this.update(id, { isActive: false }, user);
    }
    async members(id, user) {
        this.assertCanView(user);
        await this.getTeam(id, user);
        return this.prisma.user.findMany({
            where: {
                teamId: id,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            select: memberSelect,
            orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
        });
    }
    async addMember(id, dto, user) {
        this.assertAdmin(user);
        const team = await this.getTeam(id, user);
        if (!team.isActive) {
            throw new common_1.BadRequestException('Cannot assign users to an inactive team');
        }
        const member = await this.getUserInOrganization(dto.userId, user);
        const updated = await this.prisma.user.update({
            where: { id: member.id },
            data: {
                teamId: team.id,
                team: team.code,
            },
            select: memberSelect,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'team',
            entityId: team.id,
            action: 'team.member_added',
            before: member,
            after: updated,
        });
        return updated;
    }
    async removeMember(id, userId, user) {
        this.assertAdmin(user);
        await this.getTeam(id, user);
        const member = await this.getUserInOrganization(userId, user);
        if (member.teamId !== id) {
            throw new common_1.BadRequestException('User is not a member of this team');
        }
        const updated = await this.prisma.user.update({
            where: { id: member.id },
            data: {
                teamId: null,
                team: null,
            },
            select: memberSelect,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'team',
            entityId: id,
            action: 'team.member_removed',
            before: member,
            after: updated,
        });
        return updated;
    }
    async getTeam(id, user) {
        const team = await this.prisma.team.findFirst({
            where: {
                id,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            include: teamInclude,
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        return team;
    }
    async getUserInOrganization(userId, user) {
        const member = await this.prisma.user.findFirst({
            where: {
                id: userId,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            select: memberSelect,
        });
        if (!member) {
            throw new common_1.NotFoundException('User not found');
        }
        return member;
    }
    async getValidManager(managerId, user) {
        const manager = await this.prisma.user.findFirst({
            where: {
                id: managerId,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                isActive: true,
                role: {
                    in: [client_1.UserRole.ADMIN, client_1.UserRole.MANAGER],
                },
            },
            select: {
                id: true,
            },
        });
        if (!manager) {
            throw new common_1.BadRequestException('Team manager must be an active ADMIN or MANAGER');
        }
        return manager;
    }
    async syncLegacyTeamForMembers(teamId, code) {
        await this.prisma.user.updateMany({
            where: { teamId },
            data: { team: code },
        });
    }
    toTeamResponse(team) {
        const { _count, ...rest } = team;
        return {
            ...rest,
            memberCount: _count?.members ?? 0,
        };
    }
    normalizeCode(value) {
        const code = value
            .trim()
            .replace(/[^A-Za-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toUpperCase();
        if (!code) {
            throw new common_1.BadRequestException('Team code is required');
        }
        return code;
    }
    requiredText(value, message) {
        const normalized = value.trim();
        if (!normalized) {
            throw new common_1.BadRequestException(message);
        }
        return normalized;
    }
    assertCanView(user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('You do not have access to teams');
        }
    }
    assertAdmin(user) {
        if (user.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only admins can manage teams');
        }
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map