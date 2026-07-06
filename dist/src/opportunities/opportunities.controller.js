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
exports.OpportunitiesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const archive_opportunity_dto_1 = require("./dto/archive-opportunity.dto");
const change_opportunity_owner_dto_1 = require("./dto/change-opportunity-owner.dto");
const change_opportunity_stage_dto_1 = require("./dto/change-opportunity-stage.dto");
const create_opportunity_dto_1 = require("./dto/create-opportunity.dto");
const find_opportunities_dto_1 = require("./dto/find-opportunities.dto");
const update_opportunity_dto_1 = require("./dto/update-opportunity.dto");
const opportunities_service_1 = require("./opportunities.service");
let OpportunitiesController = class OpportunitiesController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) { return this.service.findAll(query, user); }
    create(dto, user) { return this.service.create(dto, user); }
    findOne(id, user) { return this.service.findOne(id, user); }
    update(id, dto, user) { return this.service.update(id, dto, user); }
    changeStage(id, dto, user) { return this.service.changeStage(id, dto, user); }
    changeOwner(id, dto, user) { return this.service.changeOwner(id, dto, user); }
    archive(id, dto, user) { return this.service.archive(id, dto, user); }
    restore(id, user) { return this.service.restore(id, user); }
};
exports.OpportunitiesController = OpportunitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.REP, client_1.UserRole.BOARDS),
    (0, permissions_decorator_1.Permissions)('opportunity:view'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_opportunities_dto_1.FindOpportunitiesDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.REP),
    (0, permissions_decorator_1.Permissions)('opportunity:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_opportunity_dto_1.CreateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.REP, client_1.UserRole.BOARDS),
    (0, permissions_decorator_1.Permissions)('opportunity:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.REP),
    (0, permissions_decorator_1.Permissions)('opportunity:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_opportunity_dto_1.UpdateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/stage'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.REP),
    (0, permissions_decorator_1.Permissions)('opportunity:change-stage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_opportunity_stage_dto_1.ChangeOpportunityStageDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "changeStage", null);
__decorate([
    (0, common_1.Patch)(':id/owner'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('opportunity:change-owner'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_opportunity_owner_dto_1.ChangeOpportunityOwnerDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "changeOwner", null);
__decorate([
    (0, common_1.Patch)(':id/archive'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('opportunity:archive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, archive_opportunity_dto_1.ArchiveOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "archive", null);
__decorate([
    (0, common_1.Patch)(':id/restore'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, permissions_decorator_1.Permissions)('opportunity:restore'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "restore", null);
exports.OpportunitiesController = OpportunitiesController = __decorate([
    (0, common_1.Controller)('opportunities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [opportunities_service_1.OpportunitiesService])
], OpportunitiesController);
//# sourceMappingURL=opportunities.controller.js.map