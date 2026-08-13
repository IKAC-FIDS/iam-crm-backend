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
exports.TenantQuotaController = exports.PlatformOrganizationQuotaController = exports.PlatformPlanQuotaController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_platform_decorator_1 = require("../common/decorators/current-platform.decorator");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const platform_admin_guard_1 = require("../platform-authority/platform-admin.guard");
const quota_dto_1 = require("./dto/quota.dto");
const platform_quota_service_1 = require("./platform-quota.service");
const quota_service_1 = require("./quota.service");
let PlatformPlanQuotaController = class PlatformPlanQuotaController {
    constructor(service) {
        this.service = service;
    }
    list(planId) {
        return this.service.planQuotas(planId);
    }
    set(planId, metric, dto, platform) {
        return this.service.setPlanQuota(planId, metric, dto, platform);
    }
};
exports.PlatformPlanQuotaController = PlatformPlanQuotaController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformPlanQuotaController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(':metric'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Param)('metric', new common_1.ParseEnumPipe(client_1.QuotaMetric))),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, quota_dto_1.SetPlanQuotaDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformPlanQuotaController.prototype, "set", null);
exports.PlatformPlanQuotaController = PlatformPlanQuotaController = __decorate([
    (0, common_1.Controller)('admin/plans/:planId/quotas'),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [platform_quota_service_1.PlatformQuotaService])
], PlatformPlanQuotaController);
let PlatformOrganizationQuotaController = class PlatformOrganizationQuotaController {
    constructor(service) {
        this.service = service;
    }
    list(id) {
        return this.service.organizationOverrides(id);
    }
    set(id, metric, dto, platform) {
        return this.service.setOverride(id, metric, dto, platform);
    }
    remove(id, metric, platform) {
        return this.service.removeOverride(id, metric, platform);
    }
};
exports.PlatformOrganizationQuotaController = PlatformOrganizationQuotaController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationQuotaController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(':metric'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Param)('metric', new common_1.ParseEnumPipe(client_1.QuotaMetric))),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, quota_dto_1.SetOrganizationQuotaOverrideDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationQuotaController.prototype, "set", null);
__decorate([
    (0, common_1.Delete)(':metric'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, common_1.Param)('metric', new common_1.ParseEnumPipe(client_1.QuotaMetric))),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationQuotaController.prototype, "remove", null);
exports.PlatformOrganizationQuotaController = PlatformOrganizationQuotaController = __decorate([
    (0, common_1.Controller)('admin/organizations/:organizationId/quotas'),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [platform_quota_service_1.PlatformQuotaService])
], PlatformOrganizationQuotaController);
let TenantQuotaController = class TenantQuotaController {
    constructor(service) {
        this.service = service;
    }
    current(tenant) {
        return this.service.summaryForTenant(tenant);
    }
};
exports.TenantQuotaController = TenantQuotaController;
__decorate([
    (0, common_1.Get)('current'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantQuotaController.prototype, "current", null);
exports.TenantQuotaController = TenantQuotaController = __decorate([
    (0, common_1.Controller)('quota'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [quota_service_1.QuotaService])
], TenantQuotaController);
//# sourceMappingURL=quota.controller.js.map