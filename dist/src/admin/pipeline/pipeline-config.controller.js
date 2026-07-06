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
exports.PipelineConfigController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const create_transition_dto_1 = require("./dto/create-transition.dto");
const update_stage_config_dto_1 = require("./dto/update-stage-config.dto");
const update_transition_dto_1 = require("./dto/update-transition.dto");
const pipeline_config_service_1 = require("./pipeline-config.service");
let PipelineConfigController = class PipelineConfigController {
    constructor(service) {
        this.service = service;
    }
    getStages() { return this.service.getStages(); }
    updateStage(stage, dto) {
        return this.service.updateStage(stage, dto);
    }
    getTransitions() { return this.service.getTransitions(); }
    createTransition(dto) { return this.service.createTransition(dto); }
    updateTransition(id, dto) { return this.service.updateTransition(id, dto); }
    deleteTransition(id) { return this.service.deleteTransition(id); }
};
exports.PipelineConfigController = PipelineConfigController;
__decorate([
    (0, common_1.Get)('stages'),
    (0, permissions_decorator_1.Permissions)('pipeline:config:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineConfigController.prototype, "getStages", null);
__decorate([
    (0, common_1.Patch)('stages/:stage'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('pipeline:config:manage'),
    __param(0, (0, common_1.Param)('stage', new common_1.ParseEnumPipe(client_1.PipelineStage))),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_stage_config_dto_1.UpdateStageConfigDto]),
    __metadata("design:returntype", void 0)
], PipelineConfigController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Get)('transitions'),
    (0, permissions_decorator_1.Permissions)('pipeline:transition:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineConfigController.prototype, "getTransitions", null);
__decorate([
    (0, common_1.Post)('transitions'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('pipeline:transition:manage'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_transition_dto_1.CreateTransitionDto]),
    __metadata("design:returntype", void 0)
], PipelineConfigController.prototype, "createTransition", null);
__decorate([
    (0, common_1.Patch)('transitions/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('pipeline:transition:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transition_dto_1.UpdateTransitionDto]),
    __metadata("design:returntype", void 0)
], PipelineConfigController.prototype, "updateTransition", null);
__decorate([
    (0, common_1.Delete)('transitions/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('pipeline:transition:manage'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PipelineConfigController.prototype, "deleteTransition", null);
exports.PipelineConfigController = PipelineConfigController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('admin/pipeline'),
    __metadata("design:paramtypes", [pipeline_config_service_1.PipelineConfigService])
], PipelineConfigController);
//# sourceMappingURL=pipeline-config.controller.js.map