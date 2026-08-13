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
exports.OrganizationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const organizations_service_1 = require("./organizations.service");
const current_tenant_decorator_1 = require("../common/decorators/current-tenant.decorator");
const organization_configuration_service_1 = require("./organization-configuration.service");
const update_organization_settings_dto_1 = require("./dto/update-organization-settings.dto");
const update_organization_branding_dto_1 = require("./dto/update-organization-branding.dto");
const create_organization_domain_dto_1 = require("./dto/create-organization-domain.dto");
const update_organization_domain_dto_1 = require("./dto/update-organization-domain.dto");
let OrganizationsController = class OrganizationsController {
    constructor(service, configuration) {
        this.service = service;
        this.configuration = configuration;
    }
    current(user) {
        return this.service.current(user);
    }
    settings(tenant) { return this.configuration.getSettings(tenant); }
    updateSettings(dto, tenant) { return this.configuration.updateSettings(dto, tenant); }
    branding(tenant) { return this.configuration.getBranding(tenant); }
    updateBranding(dto, tenant) { return this.configuration.updateBranding(dto, tenant); }
    domains(tenant) { return this.configuration.listDomains(tenant); }
    domain(id, tenant) { return this.configuration.getDomain(id, tenant); }
    createDomain(dto, tenant) { return this.configuration.createDomain(dto, tenant); }
    updateDomain(id, dto, tenant) { return this.configuration.updateDomain(id, dto, tenant); }
    verifyDomain(id, tenant) { return this.configuration.verifyDomain(id, tenant); }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Get)('organizations/current'),
    (0, permissions_decorator_1.Permissions)('organization:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "current", null);
__decorate([
    (0, common_1.Get)('organization/settings'),
    (0, permissions_decorator_1.Permissions)('organization:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "settings", null);
__decorate([
    (0, common_1.Patch)('organization/settings'),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_organization_settings_dto_1.UpdateOrganizationSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('organization/branding'),
    (0, permissions_decorator_1.Permissions)('organization:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "branding", null);
__decorate([
    (0, common_1.Patch)('organization/branding'),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_organization_branding_dto_1.UpdateOrganizationBrandingDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "updateBranding", null);
__decorate([
    (0, common_1.Get)('organization/domains'),
    (0, permissions_decorator_1.Permissions)('organization:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "domains", null);
__decorate([
    (0, common_1.Get)('organization/domains/:id'),
    (0, permissions_decorator_1.Permissions)('organization:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "domain", null);
__decorate([
    (0, common_1.Post)('organization/domains'),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_organization_domain_dto_1.CreateOrganizationDomainDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "createDomain", null);
__decorate([
    (0, common_1.Patch)('organization/domains/:id'),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_organization_domain_dto_1.UpdateOrganizationDomainDto, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "updateDomain", null);
__decorate([
    (0, common_1.Post)('organization/domains/:id/verify'),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "verifyDomain", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService, organization_configuration_service_1.OrganizationConfigurationService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map