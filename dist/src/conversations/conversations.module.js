"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsModule = void 0;
const common_1 = require("@nestjs/common");
const activities_module_1 = require("../activities/activities.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const notification_core_module_1 = require("../notification-core/notification-core.module");
const tasks_module_1 = require("../tasks/tasks.module");
const conversation_access_service_1 = require("./conversation-access.service");
const conversations_controller_1 = require("./conversations.controller");
const conversations_service_1 = require("./conversations.service");
let ConversationsModule = class ConversationsModule {
};
exports.ConversationsModule = ConversationsModule;
exports.ConversationsModule = ConversationsModule = __decorate([
    (0, common_1.Module)({
        imports: [tasks_module_1.TasksModule, activities_module_1.ActivitiesModule, notification_core_module_1.NotificationCoreModule, audit_log_module_1.AuditLogModule],
        controllers: [conversations_controller_1.ConversationsController],
        providers: [conversation_access_service_1.ConversationAccessService, conversations_service_1.ConversationsService],
    })
], ConversationsModule);
//# sourceMappingURL=conversations.module.js.map