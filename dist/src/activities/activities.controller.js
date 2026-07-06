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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const activities_service_1 = require("./activities.service");
const create_activity_dto_1 = require("./dto/create-activity.dto");
const find_activities_dto_1 = require("./dto/find-activities.dto");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let ActivitiesController = class ActivitiesController {
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    findByCompany(query, user) {
        return this.activitiesService.findByCompany(query.companyId, query, user);
    }
    findDueFollowUps(user, pagination) {
        return this.activitiesService.findDueFollowUps(user, pagination);
    }
    create(dto, user) {
        return this.activitiesService.create(dto, user);
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('activity:view'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_activities_dto_1.FindActivitiesDto, Object]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findByCompany", null);
__decorate([
    (0, common_1.Get)('follow-ups/due'),
    (0, permissions_decorator_1.Permissions)('activity:view'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "findDueFollowUps", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('activity:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_activity_dto_1.CreateActivityDto, Object]),
    __metadata("design:returntype", void 0)
], ActivitiesController.prototype, "create", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('activities'),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map