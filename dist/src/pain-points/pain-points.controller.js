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
exports.PainPointsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const pain_points_service_1 = require("./pain-points.service");
const create_pain_point_dto_1 = require("./dto/create-pain-point.dto");
const update_pain_point_dto_1 = require("./dto/update-pain-point.dto");
let PainPointsController = class PainPointsController {
    constructor(painPointsService) {
        this.painPointsService = painPointsService;
    }
    findAll() {
        return this.painPointsService.findAll();
    }
    findOne(id) {
        return this.painPointsService.findOne(id);
    }
    create(dto) {
        return this.painPointsService.create(dto);
    }
    update(id, dto) {
        return this.painPointsService.update(id, dto);
    }
    remove(id) {
        return this.painPointsService.remove(id);
    }
};
exports.PainPointsController = PainPointsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('library:pain-point:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PainPointsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('library:pain-point:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PainPointsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:pain-point:manage'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_pain_point_dto_1.CreatePainPointDto]),
    __metadata("design:returntype", void 0)
], PainPointsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:pain-point:manage'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_pain_point_dto_1.UpdatePainPointDto]),
    __metadata("design:returntype", void 0)
], PainPointsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:pain-point:manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PainPointsController.prototype, "remove", null);
exports.PainPointsController = PainPointsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('pain-points'),
    __metadata("design:paramtypes", [pain_points_service_1.PainPointsService])
], PainPointsController);
//# sourceMappingURL=pain-points.controller.js.map