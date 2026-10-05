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
exports.CollaborationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const collaboration_service_1 = require("./collaboration.service");
const collaboration_dto_1 = require("./dto/collaboration.dto");
let CollaborationController = class CollaborationController {
    constructor(collaboration) {
        this.collaboration = collaboration;
    }
    listTopics(user) { return this.collaboration.listTopics(user); }
    createTopic(dto, user) { return this.collaboration.createTopic(dto, user); }
    getTopic(id, user) { return this.collaboration.getTopic(id, user); }
    updateTopic(id, dto, user) { return this.collaboration.updateTopic(id, dto, user); }
    archiveTopic(id, user) { return this.collaboration.archiveTopic(id, user); }
    createChannel(id, dto, user) { return this.collaboration.createChannel(id, dto, user); }
    getChannel(id, user) { return this.collaboration.getChannel(id, user); }
    updateChannel(id, dto, user) { return this.collaboration.updateChannel(id, dto, user); }
    archiveChannel(id, user) { return this.collaboration.archiveChannel(id, user); }
    joinChannel(id, user) { return this.collaboration.joinPublicChannel(id, user); }
    getMembers(id, user) { return this.collaboration.getMembers(id, user); }
    addMember(id, dto, user) { return this.collaboration.addMember(id, dto, user); }
    removeMember(id, memberId, user) { return this.collaboration.removeMember(id, memberId, user); }
    heartbeat(user) { return this.collaboration.heartbeat(user); }
};
exports.CollaborationController = CollaborationController;
__decorate([
    (0, common_1.Get)('topics'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "listTopics", null);
__decorate([
    (0, common_1.Post)('topics'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [collaboration_dto_1.CreateCollaborationTopicDto, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "createTopic", null);
__decorate([
    (0, common_1.Get)('topics/:topicId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "getTopic", null);
__decorate([
    (0, common_1.Patch)('topics/:topicId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collaboration_dto_1.UpdateCollaborationTopicDto, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "updateTopic", null);
__decorate([
    (0, common_1.Delete)('topics/:topicId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "archiveTopic", null);
__decorate([
    (0, common_1.Post)('topics/:topicId/channels'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collaboration_dto_1.CreateCollaborationChannelDto, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Get)('channels/:channelId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "getChannel", null);
__decorate([
    (0, common_1.Patch)('channels/:channelId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collaboration_dto_1.UpdateCollaborationChannelDto, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "updateChannel", null);
__decorate([
    (0, common_1.Delete)('channels/:channelId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "archiveChannel", null);
__decorate([
    (0, common_1.Post)('channels/:channelId/join'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "joinChannel", null);
__decorate([
    (0, common_1.Get)('channels/:channelId/members'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)('channels/:channelId/members'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, collaboration_dto_1.AddCollaborationChannelMemberDto, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)('channels/:channelId/members/:userId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('channelId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)('presence/heartbeat'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollaborationController.prototype, "heartbeat", null);
exports.CollaborationController = CollaborationController = __decorate([
    (0, common_1.Controller)('collaboration'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [collaboration_service_1.CollaborationService])
], CollaborationController);
//# sourceMappingURL=collaboration.controller.js.map