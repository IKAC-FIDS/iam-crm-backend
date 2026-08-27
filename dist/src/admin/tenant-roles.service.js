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
exports.TenantRolesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const ADMIN_REQUIRED = ['permission:manage', 'role:manage'];
let TenantRolesService = class TenantRolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(tenant) {
        return this.prisma.role.findMany({
            where: {
                OR: [
                    { scope: client_1.RoleScope.SYSTEM },
                    {
                        scope: client_1.RoleScope.TENANT,
                        organizationId: tenant.organizationId,
                    },
                ],
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        permissions: true,
                    },
                },
            },
            orderBy: [{ scope: 'asc' }, { name: 'asc' }],
        });
    }
    async get(id, tenant) {
        const role = await this.prisma.role.findFirst({
            where: {
                id,
                OR: [
                    { scope: client_1.RoleScope.SYSTEM },
                    {
                        scope: client_1.RoleScope.TENANT,
                        organizationId: tenant.organizationId,
                    },
                ],
            },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        permissions: true,
                        organizationMemberships: true,
                    },
                },
            },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async create(dto, tenant) {
        const normalizedCode = dto.code.trim().toUpperCase();
        if (!normalizedCode) {
            throw new common_1.BadRequestException('Role code is required');
        }
        const tenantKey = tenant.organizationId.replace(/-/g, '').toUpperCase();
        const internalCode = `TENANT_${tenantKey}_${normalizedCode}`;
        try {
            return await this.prisma.role.create({
                data: {
                    code: internalCode,
                    normalizedCode,
                    name: dto.name.trim(),
                    description: dto.description?.trim() || null,
                    baseRole: dto.baseRole ?? client_1.UserRole.REP,
                    isSystem: false,
                    isActive: dto.isActive ?? true,
                    scope: client_1.RoleScope.TENANT,
                    organizationId: tenant.organizationId,
                },
                include: {
                    _count: {
                        select: {
                            users: true,
                            permissions: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Role code already exists in this tenant');
            }
            throw error;
        }
    }
    async update(id, dto, tenant) {
        const current = await this.get(id, tenant);
        if (current.scope === client_1.RoleScope.SYSTEM) {
            throw new common_1.ForbiddenException('System role definitions are operator controlled');
        }
        return this.prisma.role.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name.trim() }),
                ...(dto.description !== undefined && {
                    description: dto.description.trim() || null,
                }),
                ...(dto.baseRole !== undefined && { baseRole: dto.baseRole }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        permissions: true,
                    },
                },
            },
        });
    }
    async remove(id, tenant) {
        const current = await this.get(id, tenant);
        if (current.scope === client_1.RoleScope.SYSTEM) {
            throw new common_1.ForbiddenException('System roles cannot be deleted');
        }
        if (current._count.users) {
            throw new common_1.ConflictException('Role is assigned to users');
        }
        if (current._count.organizationMemberships) {
            throw new common_1.ConflictException('Role is assigned to organization memberships');
        }
        return this.prisma.role.delete({ where: { id } });
    }
    async permissions(id, tenant) {
        const role = await this.get(id, tenant);
        const permissions = await this.prisma.permission.findMany({
            where: { isActive: true },
            orderBy: [{ group: 'asc' }, { action: 'asc' }],
        });
        const assigned = new Set(role.permissions.map((item) => item.permissionId));
        return {
            role: {
                id: role.id,
                code: role.code,
                normalizedCode: role.normalizedCode,
                name: role.name,
                scope: role.scope,
            },
            assignedPermissionIds: [...assigned],
            assignedActions: role.permissions.map((item) => item.permission.action),
            permissions: permissions.map((item) => ({
                ...item,
                assigned: assigned.has(item.id),
            })),
        };
    }
    async replacePermissions(id, dto, tenant) {
        const role = await this.get(id, tenant);
        if (role.scope === client_1.RoleScope.SYSTEM) {
            throw new common_1.ForbiddenException('System role definitions are operator controlled');
        }
        const permissions = await this.prisma.permission.findMany({
            where: {
                id: { in: dto.permissionIds },
                isActive: true,
            },
        });
        if (permissions.length !== dto.permissionIds.length) {
            throw new common_1.BadRequestException('One or more permissions do not exist or are inactive');
        }
        const actions = new Set(permissions.map((permission) => permission.action));
        if (role.baseRole === client_1.UserRole.ADMIN &&
            ADMIN_REQUIRED.some((action) => !actions.has(action))) {
            throw new common_1.ForbiddenException('ADMIN-based tenant roles must retain permission:manage and role:manage');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({
                where: { roleId: id },
            });
            if (permissions.length) {
                await tx.rolePermission.createMany({
                    data: permissions.map((permission) => ({
                        roleId: id,
                        role: null,
                        permissionId: permission.id,
                    })),
                });
            }
        });
        permissions_guard_1.PermissionsGuard.clearCache(role.baseRole);
        permissions_guard_1.PermissionsGuard.clearCache(`role:${id}`);
        return this.permissions(id, tenant);
    }
};
exports.TenantRolesService = TenantRolesService;
exports.TenantRolesService = TenantRolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantRolesService);
//# sourceMappingURL=tenant-roles.service.js.map