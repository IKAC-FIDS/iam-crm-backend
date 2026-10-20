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
exports.NotificationPolicyAdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const notification_orchestration_dto_1 = require("../dto/notification-orchestration.dto");
const notification_policy_admin_service_1 = require("./notification-policy-admin.service");
let NotificationPolicyAdminController = class NotificationPolicyAdminController {
    constructor(policies) {
        this.policies = policies;
    }
    quiet(user) { return this.policies.quietHours(user); }
    updateQuiet(dto, user) { return this.policies.updateQuietHours(dto, user); }
    digests(user) { return this.policies.listDigests(user); }
    createDigest(dto, user) { return this.policies.createDigest(dto, user); }
    updateDigest(id, dto, user) { return this.policies.updateDigest(id, dto, user); }
    removeDigest(id, user) { return this.policies.removeDigest(id, user); }
    escalations(user) { return this.policies.listEscalations(user); }
    createEscalation(dto, user) { return this.policies.createEscalation(dto, user); }
    updateEscalation(id, dto, user) { return this.policies.updateEscalation(id, dto, user); }
    removeEscalation(id, user) { return this.policies.removeEscalation(id, user); }
};
exports.NotificationPolicyAdminController = NotificationPolicyAdminController;
__decorate([
    (0, common_1.Get)("quiet-hours"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "quiet", null);
__decorate([
    (0, common_1.Patch)("quiet-hours"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_orchestration_dto_1.UpdateQuietHoursDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "updateQuiet", null);
__decorate([
    (0, common_1.Get)("digests"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "digests", null);
__decorate([
    (0, common_1.Post)("digests"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_orchestration_dto_1.CreateDigestPolicyDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "createDigest", null);
__decorate([
    (0, common_1.Patch)("digests/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_orchestration_dto_1.UpdateDigestPolicyDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "updateDigest", null);
__decorate([
    (0, common_1.Delete)("digests/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "removeDigest", null);
__decorate([
    (0, common_1.Get)("escalations"),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "escalations", null);
__decorate([
    (0, common_1.Post)("escalations"),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_orchestration_dto_1.CreateEscalationPolicyDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "createEscalation", null);
__decorate([
    (0, common_1.Patch)("escalations/:id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_orchestration_dto_1.UpdateEscalationPolicyDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "updateEscalation", null);
__decorate([
    (0, common_1.Delete)("escalations/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationPolicyAdminController.prototype, "removeEscalation", null);
exports.NotificationPolicyAdminController = NotificationPolicyAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notification-policies"),
    __metadata("design:paramtypes", [notification_policy_admin_service_1.NotificationPolicyAdminService])
], NotificationPolicyAdminController);
//# sourceMappingURL=notification-policy-admin.controller.js.map