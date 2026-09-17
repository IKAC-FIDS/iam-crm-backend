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
exports.ConversationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const conversation_dto_1 = require("./dto/conversation.dto");
const conversations_service_1 = require("./conversations.service");
let ConversationsController = class ConversationsController {
    constructor(conversations) {
        this.conversations = conversations;
    }
    find(entityType, entityId, query, user) {
        return this.conversations.find(entityType, entityId, query, user);
    }
    createMessage(entityType, entityId, dto, user) {
        return this.conversations.createMessage(entityType, entityId, dto, user);
    }
    markRead(entityType, entityId, user) {
        return this.conversations.markRead(entityType, entityId, user);
    }
    updateMessage(messageId, dto, user) {
        return this.conversations.updateMessage(messageId, dto, user);
    }
    deleteMessage(messageId, user) {
        return this.conversations.deleteMessage(messageId, user);
    }
    updateStatus(threadId, dto, user) {
        return this.conversations.updateStatus(threadId, dto, user);
    }
};
exports.ConversationsController = ConversationsController;
__decorate([
    (0, common_1.Get)(':entityType/:entityId'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, conversation_dto_1.FindConversationDto, Object]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "find", null);
__decorate([
    (0, common_1.Post)(':entityType/:entityId/messages'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, conversation_dto_1.CreateConversationMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "createMessage", null);
__decorate([
    (0, common_1.Post)(':entityType/:entityId/read'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('entityType')),
    __param(1, (0, common_1.Param)('entityId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "markRead", null);
__decorate([
    (0, common_1.Patch)('messages/:messageId'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, conversation_dto_1.UpdateConversationMessageDto, Object]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "updateMessage", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)(':threadId/status'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('threadId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, conversation_dto_1.UpdateConversationStatusDto, Object]),
    __metadata("design:returntype", void 0)
], ConversationsController.prototype, "updateStatus", null);
exports.ConversationsController = ConversationsController = __decorate([
    (0, common_1.Controller)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService])
], ConversationsController);
//# sourceMappingURL=conversations.controller.js.map