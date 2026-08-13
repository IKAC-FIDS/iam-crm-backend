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
exports.TenantEntitlementsController = exports.PlatformSubscriptionTransitionsController = exports.PlatformSubscriptionsController = exports.PlatformPlansController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_platform_decorator_1 = require("../common/decorators/current-platform.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const platform_admin_guard_1 = require("../platform-authority/platform-admin.guard");
const entitlement_dto_1 = require("./dto/entitlement.dto");
const entitlement_service_1 = require("./entitlement.service");
const platform_entitlements_service_1 = require("./platform-entitlements.service");
let PlatformPlansController = class PlatformPlansController {
    constructor(service) {
        this.service = service;
    }
    list() { return this.service.plans(); }
    create(dto, platform) { return this.service.createPlan(dto, platform); }
    update(id, dto, platform) { return this.service.updatePlan(id, dto, platform); }
    feature(id, feature, dto, platform) { return this.service.setFeature(id, feature, dto, platform); }
};
exports.PlatformPlansController = PlatformPlansController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlatformPlansController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [entitlement_dto_1.CreatePlanDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entitlement_dto_1.UpdatePlanDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformPlansController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/features/:feature'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('feature', new common_1.ParseEnumPipe(client_1.FeatureKey))),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, entitlement_dto_1.SetPlanFeatureDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformPlansController.prototype, "feature", null);
exports.PlatformPlansController = PlatformPlansController = __decorate([
    (0, common_1.Controller)('admin/plans'),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [platform_entitlements_service_1.PlatformEntitlementsService])
], PlatformPlansController);
let PlatformSubscriptionsController = class PlatformSubscriptionsController {
    constructor(service) {
        this.service = service;
    }
    current(id) { return this.service.currentSubscription(id); }
    create(id, dto, platform) { return this.service.createSubscription(id, dto, platform); }
    overrides(id) { return this.service.listOverrides(id); }
    set(id, feature, dto, platform) { return this.service.setOverride(id, feature, dto, platform); }
    remove(id, feature, platform) { return this.service.removeOverride(id, feature, platform); }
};
exports.PlatformSubscriptionsController = PlatformSubscriptionsController;
__decorate([
    (0, common_1.Get)(':organizationId/subscription'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionsController.prototype, "current", null);
__decorate([
    (0, common_1.Post)(':organizationId/subscriptions'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entitlement_dto_1.CreateSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':organizationId/entitlements'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionsController.prototype, "overrides", null);
__decorate([
    (0, common_1.Put)(':organizationId/entitlements/:feature'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Param)('feature', new common_1.ParseEnumPipe(client_1.FeatureKey))),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, entitlement_dto_1.SetEntitlementOverrideDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionsController.prototype, "set", null);
__decorate([
    (0, common_1.Delete)(':organizationId/entitlements/:feature'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Param)('feature', new common_1.ParseEnumPipe(client_1.FeatureKey))),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionsController.prototype, "remove", null);
exports.PlatformSubscriptionsController = PlatformSubscriptionsController = __decorate([
    (0, common_1.Controller)('admin/organizations'),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [platform_entitlements_service_1.PlatformEntitlementsService])
], PlatformSubscriptionsController);
let PlatformSubscriptionTransitionsController = class PlatformSubscriptionTransitionsController {
    constructor(service) {
        this.service = service;
    }
    update(id, dto, platform) { return this.service.updateSubscription(id, dto, platform); }
    transition(id, dto, platform) { return this.service.transition(id, dto, platform); }
};
exports.PlatformSubscriptionTransitionsController = PlatformSubscriptionTransitionsController;
__decorate([
    (0, common_1.Patch)(':id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entitlement_dto_1.UpdateSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionTransitionsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, entitlement_dto_1.TransitionSubscriptionDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformSubscriptionTransitionsController.prototype, "transition", null);
exports.PlatformSubscriptionTransitionsController = PlatformSubscriptionTransitionsController = __decorate([
    (0, common_1.Controller)('admin/subscriptions'),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [platform_entitlements_service_1.PlatformEntitlementsService])
], PlatformSubscriptionTransitionsController);
let TenantEntitlementsController = class TenantEntitlementsController {
    constructor(service) {
        this.service = service;
    }
    current(tenant) { return this.service.current(tenant); }
};
exports.TenantEntitlementsController = TenantEntitlementsController;
__decorate([
    (0, common_1.Get)('current'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantEntitlementsController.prototype, "current", null);
exports.TenantEntitlementsController = TenantEntitlementsController = __decorate([
    (0, common_1.Controller)('entitlements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [entitlement_service_1.EntitlementService])
], TenantEntitlementsController);
//# sourceMappingURL=entitlements.controller.js.map