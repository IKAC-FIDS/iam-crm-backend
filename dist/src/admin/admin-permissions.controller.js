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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPermissionsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const admin_permissions_service_1 = require("./admin-permissions.service");
let AdminPermissionsController = class AdminPermissionsController {
    constructor(adminPermissionsService) {
        this.adminPermissionsService = adminPermissionsService;
    }
    getAllPermissions() {
        return this.adminPermissionsService.getAllPermissions();
    }
    getPermissionMatrix() {
        return this.adminPermissionsService.getPermissionMatrix();
    }
    getRolePermissions(role) {
        if (!Object.values(client_1.UserRole).includes(role)) {
            throw new common_1.BadRequestException('نقش نامعتبر است');
        }
        return this.adminPermissionsService.getRolePermissions(role);
    }
    assignPermissionToRole(body) {
        if (!Object.values(client_1.UserRole).includes(body.role)) {
            throw new common_1.BadRequestException('نقش نامعتبر است');
        }
        return this.adminPermissionsService.assignPermissionToRole(body.role, body.action);
    }
    revokePermissionFromRole(body) {
        if (!Object.values(client_1.UserRole).includes(body.role)) {
            throw new common_1.BadRequestException('نقش نامعتبر است');
        }
        return this.adminPermissionsService.revokePermissionFromRole(body.role, body.action);
    }
    createPermission(body) {
        if (!body.action || body.action.trim() === '') {
            throw new common_1.BadRequestException('نام دسترسی الزامی است');
        }
        return this.adminPermissionsService.createPermission(body.action, body.description);
    }
    deletePermission(action) {
        return this.adminPermissionsService.deletePermission(action);
    }
    async bulkAssignPermissions(body) {
        if (!Object.values(client_1.UserRole).includes(body.role)) {
            throw new common_1.BadRequestException('نقش نامعتبر است');
        }
        if (!body.actions || body.actions.length === 0) {
            throw new common_1.BadRequestException('حداقل یک دسترسی باید انتخاب شود');
        }
        return this.adminPermissionsService.bulkAssignPermissionsToRole(body.role, body.actions);
    }
    async bulkRevokePermissions(body) {
        if (!Object.values(client_1.UserRole).includes(body.role)) {
            throw new common_1.BadRequestException('نقش نامعتبر است');
        }
        if (!body.actions || body.actions.length === 0) {
            throw new common_1.BadRequestException('حداقل یک دسترسی باید انتخاب شود');
        }
        return this.adminPermissionsService.bulkRevokePermissionsFromRole(body.role, body.actions);
    }
    async getRolePermissionsWithDetails(role) {
        if (!Object.values(client_1.UserRole).includes(role)) {
            throw new common_1.BadRequestException('نقش نامعتبر است');
        }
        return this.adminPermissionsService.getRolePermissionsWithDetails(role);
    }
};
exports.AdminPermissionsController = AdminPermissionsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('permission:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "getAllPermissions", null);
__decorate([
    (0, common_1.Get)('matrix'),
    (0, permissions_decorator_1.Permissions)('permission:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "getPermissionMatrix", null);
__decorate([
    (0, common_1.Get)('roles/:role'),
    (0, permissions_decorator_1.Permissions)('permission:view'),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "getRolePermissions", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "assignPermissionToRole", null);
__decorate([
    (0, common_1.Delete)('revoke'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "revokePermissionFromRole", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Delete)(':action'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Param)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminPermissionsController.prototype, "deletePermission", null);
__decorate([
    (0, common_1.Post)('bulk-assign'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPermissionsController.prototype, "bulkAssignPermissions", null);
__decorate([
    (0, common_1.Post)('bulk-revoke'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPermissionsController.prototype, "bulkRevokePermissions", null);
__decorate([
    (0, common_1.Get)('roles/:role/with-details'),
    (0, permissions_decorator_1.Permissions)('permission:view'),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminPermissionsController.prototype, "getRolePermissionsWithDetails", null);
exports.AdminPermissionsController = AdminPermissionsController = __decorate([
    (0, common_1.Controller)('admin/permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_permissions_service_1.AdminPermissionsService])
], AdminPermissionsController);
//# sourceMappingURL=admin-permissions.controller.js.map