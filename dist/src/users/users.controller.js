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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_role_dto_1 = require("./dto/update-user-role.dto");
const find_users_dto_1 = require("./dto/find-users.dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const find_owner_options_dto_1 = require("./dto/find-owner-options.dto");
const find_assignee_options_dto_1 = require("./dto/find-assignee-options.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(dto, actor) {
        return this.usersService.create(dto, actor);
    }
    findAll(query, actor) {
        return this.usersService.findAll(query, actor);
    }
    getOwnerOptions(user) {
        return this.usersService.getOwnerOptions(user);
    }
    findOwnerOptions(query, user) {
        return this.usersService.findOwnerOptions(user, query);
    }
    findAssigneeOptions(query, user) {
        return this.usersService.findAssigneeOptions(user, query);
    }
    findOne(id, actor) {
        return this.usersService.findOne(id, actor);
    }
    deactivate(id, actor) {
        return this.usersService.deactivate(id, actor);
    }
    activate(id, actor) {
        return this.usersService.activate(id, actor);
    }
    updateUserRole(id, dto, actor) {
        return this.usersService.updateUserRole(id, dto, actor);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('user:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('user:view'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_users_dto_1.FindUsersDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('owner-options'),
    (0, permissions_decorator_1.Permissions)('company:assign-owner'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getOwnerOptions", null);
__decorate([
    (0, common_1.Get)('owner-options/v2'),
    (0, permissions_decorator_1.Permissions)('company:assign-owner'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_owner_options_dto_1.FindOwnerOptionsDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOwnerOptions", null);
__decorate([
    (0, common_1.Get)('assignee-options'),
    (0, permissions_decorator_1.AnyPermission)('meeting:create', 'meeting:update'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_assignee_options_dto_1.FindAssigneeOptionsDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAssigneeOptions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('user:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, permissions_decorator_1.Permissions)('user:deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, permissions_decorator_1.Permissions)('user:activate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, permissions_decorator_1.Permissions)('user:change-role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_role_dto_1.UpdateUserRoleDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateUserRole", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map