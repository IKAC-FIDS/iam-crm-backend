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
exports.PlatformOrganizationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_platform_decorator_1 = require("../common/decorators/current-platform.decorator");
const platform_admin_guard_1 = require("../platform-authority/platform-admin.guard");
const create_organization_dto_1 = require("./dto/create-organization.dto");
const find_organizations_dto_1 = require("./dto/find-organizations.dto");
const update_organization_dto_1 = require("./dto/update-organization.dto");
const provision_organization_dto_1 = require("./dto/provision-organization.dto");
const organizations_service_1 = require("./organizations.service");
let PlatformOrganizationsController = class PlatformOrganizationsController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, platform) {
        return this.service.findAll(query, platform);
    }
    create(dto, platform) {
        return this.service.create(dto, platform);
    }
    findOne(id, platform) {
        return this.service.findOne(id, platform);
    }
    update(id, dto, platform) {
        return this.service.update(id, dto, platform);
    }
    activate(id, platform) {
        return this.service.activate(id, platform);
    }
    provision(id, dto, platform) {
        return this.service.provision(id, dto, platform);
    }
    onboarding(id, platform) {
        return this.service.onboarding(id, platform);
    }
    suspend(id, platform) {
        return this.service.suspend(id, platform);
    }
    resume(id, platform) {
        return this.service.resume(id, platform);
    }
    archive(id, platform) {
        return this.service.archive(id, platform);
    }
};
exports.PlatformOrganizationsController = PlatformOrganizationsController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_organizations_dto_1.FindOrganizationsDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_organization_dto_1.CreateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_organization_dto_1.UpdateOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/provision'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, provision_organization_dto_1.ProvisionOrganizationDto, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "provision", null);
__decorate([
    (0, common_1.Get)(':id/onboarding'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "onboarding", null);
__decorate([
    (0, common_1.Patch)(':id/suspend'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "suspend", null);
__decorate([
    (0, common_1.Patch)(':id/resume'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "resume", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PlatformOrganizationsController.prototype, "archive", null);
exports.PlatformOrganizationsController = PlatformOrganizationsController = __decorate([
    (0, common_1.Controller)('admin/organizations'),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], PlatformOrganizationsController);
//# sourceMappingURL=platform-organizations.controller.js.map