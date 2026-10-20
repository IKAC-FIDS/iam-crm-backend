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
exports.SmsAdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const tenant_scope_util_1 = require("../../common/tenant/tenant-scope.util");
const sms_settings_dto_1 = require("./dto/sms-settings.dto");
const sms_settings_service_1 = require("./sms-settings.service");
let SmsAdminController = class SmsAdminController {
    constructor(settings) {
        this.settings = settings;
    }
    get(user) { return this.settings.get(tenant_scope_util_1.tenantScope.require(user).organizationId); }
    update(dto, user) { const { organizationId } = tenant_scope_util_1.tenantScope.require(user); return this.settings.update(organizationId, user.userId, dto); }
    test(dto, user) { const { organizationId } = tenant_scope_util_1.tenantScope.require(user); return this.settings.test(organizationId, user.userId, dto); }
};
exports.SmsAdminController = SmsAdminController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SmsAdminController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sms_settings_dto_1.UpdateSmsSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], SmsAdminController.prototype, "update", null);
__decorate([
    (0, common_1.Post)("test"),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sms_settings_dto_1.TestSmsDto, Object]),
    __metadata("design:returntype", void 0)
], SmsAdminController.prototype, "test", null);
exports.SmsAdminController = SmsAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notification-channels/sms"),
    __metadata("design:paramtypes", [sms_settings_service_1.SmsSettingsService])
], SmsAdminController);
//# sourceMappingURL=sms-admin.controller.js.map