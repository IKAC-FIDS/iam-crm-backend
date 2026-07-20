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
exports.RolesManagementController = exports.PermissionsManagementController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const rbac_management_dto_1 = require("./dto/rbac-management.dto");
const rbac_management_service_1 = require("./rbac-management.service");
let PermissionsManagementController = class PermissionsManagementController {
    constructor(service) {
        this.service = service;
    }
    findAll() { return this.service.permissions(); }
    findOne(id) { return this.service.permission(id); }
    create(dto) { return this.service.createPermission(dto); }
    update(id, dto) { return this.service.updatePermission(id, dto); }
    remove(id) { return this.service.deletePermission(id); }
};
exports.PermissionsManagementController = PermissionsManagementController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('permission:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionsManagementController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('permission:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PermissionsManagementController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rbac_management_dto_1.CreateManagedPermissionDto]),
    __metadata("design:returntype", void 0)
], PermissionsManagementController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rbac_management_dto_1.UpdateManagedPermissionDto]),
    __metadata("design:returntype", void 0)
], PermissionsManagementController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('permission:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PermissionsManagementController.prototype, "remove", null);
exports.PermissionsManagementController = PermissionsManagementController = __decorate([
    (0, common_1.Controller)('permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rbac_management_service_1.RbacManagementService])
], PermissionsManagementController);
let RolesManagementController = class RolesManagementController {
    constructor(service) {
        this.service = service;
    }
    findAll() { return this.service.roles(); }
    findOne(id) { return this.service.role(id); }
    create(dto) { return this.service.createRole(dto); }
    update(id, dto) { return this.service.updateRole(id, dto); }
    remove(id) { return this.service.deleteRole(id); }
    permissions(id) { return this.service.rolePermissions(id); }
    replacePermissions(id, dto) { return this.service.replaceRolePermissions(id, dto); }
};
exports.RolesManagementController = RolesManagementController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('role:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('role:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rbac_management_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rbac_management_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)('role:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "permissions", null);
__decorate([
    (0, common_1.Put)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rbac_management_dto_1.ReplaceRolePermissionsDto]),
    __metadata("design:returntype", void 0)
], RolesManagementController.prototype, "replacePermissions", null);
exports.RolesManagementController = RolesManagementController = __decorate([
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [rbac_management_service_1.RbacManagementService])
], RolesManagementController);
//# sourceMappingURL=rbac-management.controller.js.map