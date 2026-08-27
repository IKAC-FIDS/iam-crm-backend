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
exports.TenantRolesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const rbac_management_dto_1 = require("./dto/rbac-management.dto");
const tenant_roles_service_1 = require("./tenant-roles.service");
let TenantRolesController = class TenantRolesController {
    constructor(service) {
        this.service = service;
    }
    list(tenant) {
        return this.service.list(tenant);
    }
    get(id, tenant) {
        return this.service.get(id, tenant);
    }
    create(dto, tenant) {
        return this.service.create(dto, tenant);
    }
    update(id, dto, tenant) {
        return this.service.update(id, dto, tenant);
    }
    remove(id, tenant) {
        return this.service.remove(id, tenant);
    }
    permissions(id, tenant) {
        return this.service.permissions(id, tenant);
    }
    replacePermissions(id, dto, tenant) {
        return this.service.replacePermissions(id, dto, tenant);
    }
};
exports.TenantRolesController = TenantRolesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('role:view'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('role:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rbac_management_dto_1.CreateRoleDto, Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rbac_management_dto_1.UpdateRoleDto, Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)('role:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "permissions", null);
__decorate([
    (0, common_1.Put)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)('role:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rbac_management_dto_1.ReplaceRolePermissionsDto, Object]),
    __metadata("design:returntype", void 0)
], TenantRolesController.prototype, "replacePermissions", null);
exports.TenantRolesController = TenantRolesController = __decorate([
    (0, common_1.Controller)('organization/roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [tenant_roles_service_1.TenantRolesService])
], TenantRolesController);
//# sourceMappingURL=tenant-roles.controller.js.map