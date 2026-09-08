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
exports.PushSubscriptionController = exports.PushAdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const tenant_scope_util_1 = require("../../common/tenant/tenant-scope.util");
const push_dto_1 = require("./dto/push.dto");
const push_settings_service_1 = require("./push-settings.service");
let PushAdminController = class PushAdminController {
    constructor(push) {
        this.push = push;
    }
    get(user) { return this.push.get(tenant_scope_util_1.tenantScope.require(user)); }
    update(dto, user) { return this.push.update(tenant_scope_util_1.tenantScope.require(user), dto); }
    test(dto, user) { return this.push.test(tenant_scope_util_1.tenantScope.require(user), dto); }
};
exports.PushAdminController = PushAdminController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PushAdminController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [push_dto_1.UpdatePushSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], PushAdminController.prototype, "update", null);
__decorate([
    (0, common_1.Post)("test"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [push_dto_1.TestPushDto, Object]),
    __metadata("design:returntype", void 0)
], PushAdminController.prototype, "test", null);
exports.PushAdminController = PushAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notification-channels/push"),
    __metadata("design:paramtypes", [push_settings_service_1.PushSettingsService])
], PushAdminController);
let PushSubscriptionController = class PushSubscriptionController {
    constructor(push) {
        this.push = push;
    }
    config(user) { return this.push.publicConfig(tenant_scope_util_1.tenantScope.require(user)); }
    list(user) { return this.push.listOwn(tenant_scope_util_1.tenantScope.require(user)); }
    register(dto, user, userAgent) { return this.push.register(tenant_scope_util_1.tenantScope.require(user), dto, userAgent); }
    remove(id, user) { return this.push.removeOwn(tenant_scope_util_1.tenantScope.require(user), id); }
};
exports.PushSubscriptionController = PushSubscriptionController;
__decorate([
    (0, common_1.Get)("public-config"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PushSubscriptionController.prototype, "config", null);
__decorate([
    (0, common_1.Get)("subscriptions"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PushSubscriptionController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("subscriptions"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Headers)("user-agent")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [push_dto_1.RegisterPushSubscriptionDto, Object, String]),
    __metadata("design:returntype", void 0)
], PushSubscriptionController.prototype, "register", null);
__decorate([
    (0, common_1.Delete)("subscriptions/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PushSubscriptionController.prototype, "remove", null);
exports.PushSubscriptionController = PushSubscriptionController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("notification-push"),
    __metadata("design:paramtypes", [push_settings_service_1.PushSettingsService])
], PushSubscriptionController);
//# sourceMappingURL=push.controller.js.map