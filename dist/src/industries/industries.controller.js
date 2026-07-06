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
exports.IndustriesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const industries_service_1 = require("./industries.service");
const create_industry_dto_1 = require("./dto/create-industry.dto");
const update_industry_dto_1 = require("./dto/update-industry.dto");
let IndustriesController = class IndustriesController {
    constructor(industriesService) {
        this.industriesService = industriesService;
    }
    findAll() {
        return this.industriesService.findAll();
    }
    findOne(id) {
        return this.industriesService.findOne(id);
    }
    create(dto) {
        return this.industriesService.create(dto);
    }
    update(id, dto) {
        return this.industriesService.update(id, dto);
    }
    remove(id) {
        return this.industriesService.remove(id);
    }
};
exports.IndustriesController = IndustriesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('library:industry:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IndustriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('library:industry:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IndustriesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:industry:manage'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_industry_dto_1.CreateIndustryDto]),
    __metadata("design:returntype", void 0)
], IndustriesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:industry:manage'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_industry_dto_1.UpdateIndustryDto]),
    __metadata("design:returntype", void 0)
], IndustriesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:industry:manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IndustriesController.prototype, "remove", null);
exports.IndustriesController = IndustriesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('industries'),
    __metadata("design:paramtypes", [industries_service_1.IndustriesService])
], IndustriesController);
//# sourceMappingURL=industries.controller.js.map