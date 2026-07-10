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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const assign_task_dto_1 = require("./dto/assign-task.dto");
const change_task_status_dto_1 = require("./dto/change-task-status.dto");
const complete_task_dto_1 = require("./dto/complete-task.dto");
const create_task_dto_1 = require("./dto/create-task.dto");
const find_tasks_dto_1 = require("./dto/find-tasks.dto");
const reschedule_task_dto_1 = require("./dto/reschedule-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const tasks_service_1 = require("./tasks.service");
let TasksController = class TasksController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) {
        return this.service.findAll(query, user);
    }
    create(dto, user) {
        return this.service.create(dto, user);
    }
    findOne(id, user) {
        return this.service.findOne(id, user);
    }
    update(id, dto, user) {
        return this.service.update(id, dto, user);
    }
    changeStatus(id, dto, user) {
        return this.service.changeStatus(id, dto, user);
    }
    assign(id, dto, user) {
        return this.service.assign(id, dto, user);
    }
    complete(id, dto, user) {
        return this.service.complete(id, dto, user);
    }
    reschedule(id, dto, user) {
        return this.service.reschedule(id, dto, user);
    }
    remove(id, user) {
        return this.service.remove(id, user);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('task:view'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_tasks_dto_1.FindTasksDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('task:create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_task_dto_1.CreateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('task:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('task:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_task_dto_1.UpdateTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('task:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_task_status_dto_1.ChangeTaskStatusDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, permissions_decorator_1.Permissions)('task:assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_task_dto_1.AssignTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "assign", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, permissions_decorator_1.Permissions)('task:complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, complete_task_dto_1.CompleteTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/reschedule'),
    (0, permissions_decorator_1.Permissions)('task:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reschedule_task_dto_1.RescheduleTaskDto, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('task:delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "remove", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map