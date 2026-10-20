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
exports.PersonalTodosController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const create_personal_todo_dto_1 = require("./dto/create-personal-todo.dto");
const find_personal_todos_dto_1 = require("./dto/find-personal-todos.dto");
const update_personal_todo_dto_1 = require("./dto/update-personal-todo.dto");
const personal_todos_service_1 = require("./personal-todos.service");
let PersonalTodosController = class PersonalTodosController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) {
        return this.service.findAll(query, user);
    }
    create(dto, user) {
        return this.service.create(dto, user);
    }
    update(id, dto, user) {
        return this.service.update(id, dto, user);
    }
    complete(id, user) {
        return this.service.complete(id, user);
    }
    reopen(id, user) {
        return this.service.reopen(id, user);
    }
    remove(id, user) {
        return this.service.remove(id, user);
    }
    convertToTask(id, user) {
        return this.service.convertToTask(id, user);
    }
};
exports.PersonalTodosController = PersonalTodosController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_personal_todos_dto_1.FindPersonalTodosDto, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_personal_todo_dto_1.CreatePersonalTodoDto, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_personal_todo_dto_1.UpdatePersonalTodoDto, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/complete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(":id/reopen"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "reopen", null);
__decorate([
    (0, common_1.Delete)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/convert-to-task"),
    (0, permissions_decorator_1.Permissions)("task:create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonalTodosController.prototype, "convertToTask", null);
exports.PersonalTodosController = PersonalTodosController = __decorate([
    (0, common_1.Controller)("personal-todos"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [personal_todos_service_1.PersonalTodosService])
], PersonalTodosController);
//# sourceMappingURL=personal-todos.controller.js.map