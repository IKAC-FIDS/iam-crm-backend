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
exports.RbacManagementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const prisma_service_1 = require("../prisma/prisma.service");
const ADMIN_REQUIRED = ['permission:manage', 'role:manage'];
let RbacManagementService = class RbacManagementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    permissions() { return this.prisma.permission.findMany({ orderBy: [{ group: 'asc' }, { action: 'asc' }] }); }
    async permission(id) { const item = await this.prisma.permission.findUnique({ where: { id } }); if (!item)
        throw new common_1.NotFoundException('Permission not found'); return item; }
    async createPermission(dto) { try {
        return await this.prisma.permission.create({ data: { ...dto, isSystem: false, isActive: dto.isActive ?? true } });
    }
    catch {
        throw new common_1.ConflictException('Permission action already exists');
    } }
    async updatePermission(id, dto) { const current = await this.permission(id); if (current.isSystem && dto.action && dto.action !== current.action)
        throw new common_1.ForbiddenException('System permission action cannot be changed'); if (current.isSystem && ADMIN_REQUIRED.includes(current.action) && dto.isActive === false)
        throw new common_1.ForbiddenException('Critical RBAC permissions cannot be deactivated'); try {
        const updated = await this.prisma.permission.update({ where: { id }, data: dto });
        permissions_guard_1.PermissionsGuard.clearCache();
        return updated;
    }
    catch {
        throw new common_1.ConflictException('Permission action already exists');
    } }
    async deletePermission(id) { const current = await this.permission(id); if (current.isSystem)
        throw new common_1.ForbiddenException('System permissions cannot be deleted'); const assigned = await this.prisma.rolePermission.count({ where: { permissionId: id } }); if (assigned)
        throw new common_1.ConflictException('Permission is assigned to one or more roles'); return this.prisma.permission.delete({ where: { id } }); }
    roles() { return this.prisma.role.findMany({ include: { _count: { select: { users: true, permissions: true } } }, orderBy: { code: 'asc' } }); }
    async role(id) { const item = await this.prisma.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } } }); if (!item)
        throw new common_1.NotFoundException('Role not found'); return item; }
    async createRole(dto) { try {
        return await this.prisma.role.create({ data: { ...dto, baseRole: dto.baseRole ?? client_1.UserRole.REP, isSystem: false, isActive: dto.isActive ?? true } });
    }
    catch {
        throw new common_1.ConflictException('Role code already exists');
    } }
    async updateRole(id, dto) { const current = await this.role(id); if (current.isSystem && dto.baseRole && dto.baseRole !== current.baseRole)
        throw new common_1.ForbiddenException('System role base scope cannot be changed'); if (current.isSystem && dto.isActive === false)
        throw new common_1.ForbiddenException('System roles cannot be deactivated'); return this.prisma.role.update({ where: { id }, data: dto }); }
    async deleteRole(id) { const current = await this.role(id); if (current.isSystem)
        throw new common_1.ForbiddenException('System roles cannot be deleted'); if (current._count.users)
        throw new common_1.ConflictException('Role is assigned to users'); return this.prisma.role.delete({ where: { id } }); }
    async rolePermissions(id) { const role = await this.role(id); const permissions = await this.prisma.permission.findMany({ where: { isActive: true }, orderBy: { action: 'asc' } }); const assigned = new Set(role.permissions.map((item) => item.permissionId)); return { role: { id: role.id, code: role.code, name: role.name }, assignedPermissionIds: [...assigned], assignedActions: role.permissions.map((item) => item.permission.action), permissions: permissions.map((item) => ({ ...item, assigned: assigned.has(item.id) })) }; }
    async replaceRolePermissions(id, dto) {
        const role = await this.role(id);
        const permissions = await this.prisma.permission.findMany({ where: { id: { in: dto.permissionIds }, isActive: true } });
        if (permissions.length !== dto.permissionIds.length)
            throw new common_1.BadRequestException('One or more permissions do not exist or are inactive');
        const actions = new Set(permissions.map((item) => item.action));
        if (role.code === client_1.UserRole.ADMIN && ADMIN_REQUIRED.some((action) => !actions.has(action)))
            throw new common_1.ForbiddenException('ADMIN must retain permission:manage and role:manage');
        await this.prisma.$transaction(async (tx) => { await tx.rolePermission.deleteMany({ where: { roleId: id } }); await tx.rolePermission.createMany({ data: permissions.map((permission) => ({ roleId: id, role: role.isSystem ? role.baseRole : null, permissionId: permission.id })) }); });
        permissions_guard_1.PermissionsGuard.clearCache(role.baseRole);
        permissions_guard_1.PermissionsGuard.clearCache(`role:${id}`);
        return this.rolePermissions(id);
    }
};
exports.RbacManagementService = RbacManagementService;
exports.RbacManagementService = RbacManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacManagementService);
//# sourceMappingURL=rbac-management.service.js.map