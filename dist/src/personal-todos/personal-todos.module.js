"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalTodosModule = void 0;
const common_1 = require("@nestjs/common");
const company_access_module_1 = require("../companies/company-access.module");
const prisma_module_1 = require("../prisma/prisma.module");
const tasks_module_1 = require("../tasks/tasks.module");
const personal_todo_reminder_service_1 = require("./personal-todo-reminder.service");
const personal_todos_controller_1 = require("./personal-todos.controller");
const personal_todos_service_1 = require("./personal-todos.service");
let PersonalTodosModule = class PersonalTodosModule {
};
exports.PersonalTodosModule = PersonalTodosModule;
exports.PersonalTodosModule = PersonalTodosModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, tasks_module_1.TasksModule, company_access_module_1.CompanyAccessModule],
        controllers: [personal_todos_controller_1.PersonalTodosController],
        providers: [personal_todos_service_1.PersonalTodosService, personal_todo_reminder_service_1.PersonalTodoReminderService],
        exports: [personal_todos_service_1.PersonalTodosService],
    })
], PersonalTodosModule);
//# sourceMappingURL=personal-todos.module.js.map