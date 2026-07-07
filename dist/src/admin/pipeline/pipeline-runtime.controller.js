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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineRuntimeController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const pipeline_config_service_1 = require("./pipeline-config.service");
let PipelineRuntimeController = class PipelineRuntimeController {
    constructor(service) {
        this.service = service;
    }
    getActiveStages() {
        return this.service.getStages(true);
    }
    getTransitions() {
        return this.service.getTransitions();
    }
};
exports.PipelineRuntimeController = PipelineRuntimeController;
__decorate([
    (0, common_1.Get)('stages'),
    (0, permissions_decorator_1.Permissions)('opportunity:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineRuntimeController.prototype, "getActiveStages", null);
__decorate([
    (0, common_1.Get)('transitions'),
    (0, permissions_decorator_1.Permissions)('opportunity:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PipelineRuntimeController.prototype, "getTransitions", null);
exports.PipelineRuntimeController = PipelineRuntimeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.REP, client_1.UserRole.BOARDS),
    (0, common_1.Controller)('pipeline'),
    __metadata("design:paramtypes", [pipeline_config_service_1.PipelineConfigService])
], PipelineRuntimeController);
//# sourceMappingURL=pipeline-runtime.controller.js.map