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
exports.AdminPermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const permissions_guard_1 = require("../common/guards/permissions.guard");
let AdminPermissionsService = class AdminPermissionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: { action: 'asc' },
        });
    }
    async getRolePermissions(role) {
        const rolePermissions = await this.prisma.rolePermission.findMany({
            where: { role },
            include: { permission: true },
        });
        return rolePermissions.map((rp) => ({
            id: rp.id,
            action: rp.permission.action,
            description: rp.permission.description,
        }));
    }
    async assignPermissionToRole(role, action) {
        const permission = await this.prisma.permission.findUnique({
            where: { action },
        });
        if (!permission) {
            throw new common_1.NotFoundException('دسترسی پیدا نشد');
        }
        const existing = await this.prisma.rolePermission.findUnique({
            where: {
                role_permissionId: {
                    role,
                    permissionId: permission.id,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('این دسترسی قبلاً به این نقش اختصاص داده شده است');
        }
        const result = await this.prisma.rolePermission.create({
            data: {
                role,
                permissionId: permission.id,
            },
            include: { permission: true },
        });
        permissions_guard_1.PermissionsGuard.clearCache(role);
        return {
            message: `دسترسی ${action} با موفقیت به نقش ${role} اختصاص یافت`,
            data: result,
        };
    }
    async revokePermissionFromRole(role, action) {
        const permission = await this.prisma.permission.findUnique({
            where: { action },
        });
        if (!permission) {
            throw new common_1.NotFoundException('دسترسی پیدا نشد');
        }
        const rolePermission = await this.prisma.rolePermission.findUnique({
            where: {
                role_permissionId: {
                    role,
                    permissionId: permission.id,
                },
            },
        });
        if (!rolePermission) {
            throw new common_1.NotFoundException('این دسترسی به این نقش اختصاص داده نشده است');
        }
        await this.prisma.rolePermission.delete({
            where: { id: rolePermission.id },
        });
        permissions_guard_1.PermissionsGuard.clearCache(role);
        return {
            message: `دسترسی ${action} با موفقیت از نقش ${role} حذف شد`,
        };
    }
    async createPermission(action, description) {
        const existing = await this.prisma.permission.findUnique({
            where: { action },
        });
        if (existing) {
            throw new common_1.BadRequestException('این دسترسی قبلاً وجود دارد');
        }
        return this.prisma.permission.create({
            data: { action, description },
        });
    }
    async deletePermission(action) {
        const permission = await this.prisma.permission.findUnique({
            where: { action },
            include: { rolePermissions: true },
        });
        if (!permission) {
            throw new common_1.NotFoundException('دسترسی پیدا نشد');
        }
        if (permission.rolePermissions.length > 0) {
            throw new common_1.BadRequestException('این دسترسی به نقش‌هایی اختصاص داده شده است، ابتدا آن‌ها را حذف کنید');
        }
        await this.prisma.permission.delete({
            where: { id: permission.id },
        });
        permissions_guard_1.PermissionsGuard.clearCache();
        return {
            message: `دسترسی ${action} با موفقیت حذف شد`,
        };
    }
    async bulkAssignPermissionsToRole(role, actions) {
        if (!actions || actions.length === 0) {
            throw new common_1.BadRequestException('حداقل یک دسترسی باید انتخاب شود');
        }
        const permissions = await this.prisma.permission.findMany({
            where: { action: { in: actions } },
        });
        if (permissions.length !== actions.length) {
            const foundActions = permissions.map(p => p.action);
            const notFound = actions.filter(a => !foundActions.includes(a));
            throw new common_1.NotFoundException(`دسترسی‌های زیر یافت نشدند: ${notFound.join(', ')}`);
        }
        const existingRolePermissions = await this.prisma.rolePermission.findMany({
            where: { role },
            select: { permissionId: true },
        });
        const existingPermissionIds = new Set(existingRolePermissions.map(rp => rp.permissionId));
        const newPermissions = permissions.filter(p => !existingPermissionIds.has(p.id));
        if (newPermissions.length === 0) {
            throw new common_1.BadRequestException('همه دسترسی‌های انتخاب شده قبلاً به این نقش اختصاص داده شده‌اند');
        }
        const result = await this.prisma.$transaction(newPermissions.map(permission => this.prisma.rolePermission.create({
            data: {
                role,
                permissionId: permission.id,
            },
        })));
        permissions_guard_1.PermissionsGuard.clearCache(role);
        return {
            message: `${result.length} دسترسی با موفقیت به نقش ${role} اختصاص یافت`,
            assigned: result.map(rp => ({
                id: rp.id,
                action: newPermissions.find(p => p.id === rp.permissionId)?.action,
            })),
            skipped: permissions.length - result.length,
        };
    }
    async bulkRevokePermissionsFromRole(role, actions) {
        if (!actions || actions.length === 0) {
            throw new common_1.BadRequestException('حداقل یک دسترسی باید انتخاب شود');
        }
        const permissions = await this.prisma.permission.findMany({
            where: { action: { in: actions } },
        });
        if (permissions.length !== actions.length) {
            const foundActions = permissions.map(p => p.action);
            const notFound = actions.filter(a => !foundActions.includes(a));
            throw new common_1.NotFoundException(`دسترسی‌های زیر یافت نشدند: ${notFound.join(', ')}`);
        }
        const permissionIds = permissions.map(p => p.id);
        const rolePermissions = await this.prisma.rolePermission.findMany({
            where: {
                role,
                permissionId: { in: permissionIds },
            },
        });
        if (rolePermissions.length === 0) {
            throw new common_1.BadRequestException('هیچکدام از دسترسی‌های انتخاب شده به این نقش اختصاص داده نشده‌اند');
        }
        const deleted = await this.prisma.rolePermission.deleteMany({
            where: {
                id: { in: rolePermissions.map(rp => rp.id) },
            },
        });
        permissions_guard_1.PermissionsGuard.clearCache(role);
        return {
            message: `${deleted.count} دسترسی با موفقیت از نقش ${role} حذف شد`,
            removed: rolePermissions.map(rp => ({
                action: permissions.find(p => p.id === rp.permissionId)?.action,
            })),
            skipped: actions.length - deleted.count,
        };
    }
    async getRolePermissionsWithDetails(role) {
        const rolePermissions = await this.prisma.rolePermission.findMany({
            where: { role },
            include: { permission: true },
        });
        const allPermissions = await this.prisma.permission.findMany({
            orderBy: { action: 'asc' },
        });
        const assignedActions = new Set(rolePermissions.map(rp => rp.permission.action));
        return {
            role,
            permissions: allPermissions.map(p => ({
                action: p.action,
                description: p.description,
                isAssigned: assignedActions.has(p.action),
            })),
            assignedCount: rolePermissions.length,
            totalCount: allPermissions.length,
        };
    }
};
exports.AdminPermissionsService = AdminPermissionsService;
exports.AdminPermissionsService = AdminPermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminPermissionsService);
//# sourceMappingURL=admin-permissions.service.js.map