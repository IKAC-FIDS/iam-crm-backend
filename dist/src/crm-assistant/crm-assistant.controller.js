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
exports.CrmAssistantController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const crm_assistant_service_1 = require("./crm-assistant.service");
const ask_crm_assistant_dto_1 = require("./dto/ask-crm-assistant.dto");
const confirm_crm_assistant_action_dto_1 = require("./dto/confirm-crm-assistant-action.dto");
const crm_assistant_actions_service_1 = require("./crm-assistant-actions.service");
let CrmAssistantController = class CrmAssistantController {
    constructor(assistant, actions) {
        this.assistant = assistant;
        this.actions = actions;
    }
    ask(dto, user) {
        return this.assistant.ask(dto, user);
    }
    confirm(dto, user) {
        return this.actions.confirm(dto.token, user);
    }
};
exports.CrmAssistantController = CrmAssistantController;
__decorate([
    (0, common_1.Post)('ask'),
    (0, permissions_decorator_1.AnyPermission)('company:view', 'opportunity:view', 'task:view', 'meeting:view'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ask_crm_assistant_dto_1.AskCrmAssistantDto, Object]),
    __metadata("design:returntype", void 0)
], CrmAssistantController.prototype, "ask", null);
__decorate([
    (0, common_1.Post)('actions/confirm'),
    (0, permissions_decorator_1.AnyPermission)('company:create', 'opportunity:create', 'task:create'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [confirm_crm_assistant_action_dto_1.ConfirmCrmAssistantActionDto, Object]),
    __metadata("design:returntype", void 0)
], CrmAssistantController.prototype, "confirm", null);
exports.CrmAssistantController = CrmAssistantController = __decorate([
    (0, common_1.Controller)('assistant'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [crm_assistant_service_1.CrmAssistantService, crm_assistant_actions_service_1.CrmAssistantActionsService])
], CrmAssistantController);
//# sourceMappingURL=crm-assistant.controller.js.map