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
exports.SsoAdminController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const current_tenant_decorator_1 = require("../../common/decorators/current-tenant.decorator");
const create_sso_provider_dto_1 = require("./dto/create-sso-provider.dto");
const update_sso_provider_dto_1 = require("./dto/update-sso-provider.dto");
const sso_provider_service_1 = require("./sso-provider.service");
const client_1 = require("@prisma/client");
const feature_guard_1 = require("../../entitlements/feature.guard");
const require_feature_decorator_1 = require("../../entitlements/require-feature.decorator");
let SsoAdminController = class SsoAdminController {
    constructor(service) {
        this.service = service;
    }
    listProviders(tenant) {
        return this.service.listProviders(tenant);
    }
    getProvider(id, tenant) {
        return this.service.getProvider(id, tenant);
    }
    createProvider(dto, actor, tenant) {
        return this.service.createProvider(dto, tenant, actor.userId);
    }
    updateProvider(id, dto, actor, tenant) {
        return this.service.updateProvider(id, dto, tenant, actor.userId);
    }
    disableProvider(id, actor, tenant) {
        return this.service.disableProvider(id, tenant, actor.userId);
    }
    deleteProvider(id, actor, tenant) {
        return this.service.deleteProvider(id, tenant, actor.userId);
    }
    testConnection(id, tenant, actor) {
        return this.service.testConnection(id, tenant, actor.userId);
    }
};
exports.SsoAdminController = SsoAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)("sso-provider:view"),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "listProviders", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.Permissions)("sso-provider:view"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "getProvider", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)("sso-provider:manage"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sso_provider_dto_1.CreateSsoProviderDto, Object, Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "createProvider", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.Permissions)("sso-provider:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sso_provider_dto_1.UpdateSsoProviderDto, Object, Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "updateProvider", null);
__decorate([
    (0, common_1.Patch)(":id/disable"),
    (0, permissions_decorator_1.Permissions)("sso-provider:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "disableProvider", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, permissions_decorator_1.Permissions)("sso-provider:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "deleteProvider", null);
__decorate([
    (0, common_1.Post)(":id/test-connection"),
    (0, permissions_decorator_1.Permissions)("sso-provider:manage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SsoAdminController.prototype, "testConnection", null);
exports.SsoAdminController = SsoAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard, feature_guard_1.FeatureGuard),
    (0, require_feature_decorator_1.RequireFeature)(client_1.FeatureKey.SSO),
    (0, common_1.Controller)("admin/sso-providers"),
    __metadata("design:paramtypes", [sso_provider_service_1.SsoProviderService])
], SsoAdminController);
//# sourceMappingURL=sso-admin.controller.js.map