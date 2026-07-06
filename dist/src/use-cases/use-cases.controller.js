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
exports.UseCasesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const use_cases_service_1 = require("./use-cases.service");
const create_use_case_dto_1 = require("./dto/create-use-case.dto");
const update_use_case_dto_1 = require("./dto/update-use-case.dto");
let UseCasesController = class UseCasesController {
    constructor(useCasesService) {
        this.useCasesService = useCasesService;
    }
    findAll() {
        return this.useCasesService.findAll();
    }
    findOne(id) {
        return this.useCasesService.findOne(id);
    }
    create(dto) {
        return this.useCasesService.create(dto);
    }
    update(id, dto) {
        return this.useCasesService.update(id, dto);
    }
    remove(id) {
        return this.useCasesService.remove(id);
    }
};
exports.UseCasesController = UseCasesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('library:use-case:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UseCasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('library:use-case:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UseCasesController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:use-case:manage'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_use_case_dto_1.CreateUseCaseDto]),
    __metadata("design:returntype", void 0)
], UseCasesController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:use-case:manage'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_use_case_dto_1.UpdateUseCaseDto]),
    __metadata("design:returntype", void 0)
], UseCasesController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('library:use-case:manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UseCasesController.prototype, "remove", null);
exports.UseCasesController = UseCasesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('use-cases'),
    __metadata("design:paramtypes", [use_cases_service_1.UseCasesService])
], UseCasesController);
//# sourceMappingURL=use-cases.controller.js.map