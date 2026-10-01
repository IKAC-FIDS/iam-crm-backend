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
exports.OperationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const operations_companies_query_dto_1 = require("./dto/operations-companies-query.dto");
const operations_workspace_query_dto_1 = require("./dto/operations-workspace-query.dto");
const operations_service_1 = require("./operations.service");
let OperationsController = class OperationsController {
    constructor(service) {
        this.service = service;
    }
    getWorkspace(query, user) {
        return this.service.getWorkspace(query, user);
    }
    getCompanies(query, user) {
        return this.service.getCompanies(query, user);
    }
};
exports.OperationsController = OperationsController;
__decorate([
    (0, common_1.Get)("workspace"),
    (0, permissions_decorator_1.Permissions)("task:view", "meeting:view", "opportunity:view"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [operations_workspace_query_dto_1.OperationsWorkspaceQueryDto, Object]),
    __metadata("design:returntype", void 0)
], OperationsController.prototype, "getWorkspace", null);
__decorate([
    (0, common_1.Get)("companies"),
    (0, permissions_decorator_1.Permissions)("company:view", "task:view", "opportunity:view", "activity:view", "meeting:view"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [operations_companies_query_dto_1.OperationsCompaniesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], OperationsController.prototype, "getCompanies", null);
exports.OperationsController = OperationsController = __decorate([
    (0, common_1.Controller)("operations"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [operations_service_1.OperationsService])
], OperationsController);
//# sourceMappingURL=operations.controller.js.map