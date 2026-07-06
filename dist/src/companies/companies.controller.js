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
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const companies_service_1 = require("./companies.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const change_stage_dto_1 = require("./dto/change-stage.dto");
const change_owner_dto_1 = require("./dto/change-owner.dto");
const find_companies_dto_1 = require("./dto/find-companies.dto");
const archive_company_dto_1 = require("./dto/archive-company.dto");
let CompaniesController = class CompaniesController {
    constructor(companiesService) {
        this.companiesService = companiesService;
    }
    findAll(user, query) {
        return this.companiesService.findAll(user, query, {
            stage: query.stage,
            priority: query.priority,
            withoutOwner: query.withoutOwner === 'true',
            search: query.search,
            ownerId: query.ownerId,
            includeArchived: query.includeArchived === 'true',
            archivedOnly: query.archivedOnly === 'true',
        });
    }
    findOne(id, user) {
        return this.companiesService.findOne(id, user);
    }
    create(dto, user) {
        return this.companiesService.create(dto, user);
    }
    update(id, dto, user) {
        return this.companiesService.update(id, dto, user);
    }
    changeStage(id, dto, user) {
        return this.companiesService.changeStage(id, dto, user);
    }
    archive(id, dto, user) {
        return this.companiesService.archive(id, dto, user);
    }
    restore(id, user) {
        return this.companiesService.restore(id, user);
    }
    bulkChangeOwner(dto, user) {
        return this.companiesService.bulkChangeOwner(dto, user);
    }
    changeOwner(id, dto, user) {
        return this.companiesService.changeOwner(id, dto, user);
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, find_companies_dto_1.FindCompaniesDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_dto_1.CreateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_stage_dto_1.ChangeStageDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "changeStage", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('company:archive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, archive_company_dto_1.ArchiveCompanyDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "archive", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('company:restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "restore", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('company:bulk-change-owner'),
    (0, common_1.Patch)('bulk/owner'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [change_owner_dto_1.BulkChangeOwnerDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "bulkChangeOwner", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('company:change-owner'),
    (0, common_1.Patch)(':id/owner'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_owner_dto_1.ChangeOwnerDto, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "changeOwner", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map