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
exports.LookupsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const active_filter_dto_1 = require("../common/dto/active-filter.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_lookup_option_dto_1 = require("./dto/create-lookup-option.dto");
const update_lookup_option_dto_1 = require("./dto/update-lookup-option.dto");
const lookups_service_1 = require("./lookups.service");
let LookupsController = class LookupsController {
    constructor(service) {
        this.service = service;
    }
    findAll(group, query) { return this.service.findAll(group, query.active ?? true); }
    create(group, dto) { return this.service.create(group, dto); }
    update(group, id, dto) { return this.service.update(group, id, dto); }
    remove(group, id) { return this.service.remove(group, id); }
};
exports.LookupsController = LookupsController;
__decorate([
    (0, common_1.Get)(':group'),
    (0, permissions_decorator_1.Permissions)('lookup:view'),
    __param(0, (0, common_1.Param)('group')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, active_filter_dto_1.ActiveFilterDto]),
    __metadata("design:returntype", void 0)
], LookupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':group'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('lookup:manage'),
    __param(0, (0, common_1.Param)('group')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_lookup_option_dto_1.CreateLookupOptionDto]),
    __metadata("design:returntype", void 0)
], LookupsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':group/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('lookup:manage'),
    __param(0, (0, common_1.Param)('group')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_lookup_option_dto_1.UpdateLookupOptionDto]),
    __metadata("design:returntype", void 0)
], LookupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':group/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, permissions_decorator_1.Permissions)('lookup:manage'),
    __param(0, (0, common_1.Param)('group')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LookupsController.prototype, "remove", null);
exports.LookupsController = LookupsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('lookups'),
    __metadata("design:paramtypes", [lookups_service_1.LookupsService])
], LookupsController);
//# sourceMappingURL=lookups.controller.js.map