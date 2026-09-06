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
exports.EmailController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const email_service_1 = require("./email.service");
const email_settings_dto_1 = require("./dto/email-settings.dto");
let EmailController = class EmailController {
    constructor(email) {
        this.email = email;
    }
    get(user) { return this.email.getSettings((0, tenant_scope_util_1.getCurrentOrganizationId)(user)); }
    update(dto, user) { return this.email.updateSettings((0, tenant_scope_util_1.getCurrentOrganizationId)(user), user.userId, dto); }
    test(dto, user) { return this.email.sendTest((0, tenant_scope_util_1.getCurrentOrganizationId)(user), user.userId, dto.to); }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmailController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_settings_dto_1.UpdateEmailSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], EmailController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_settings_dto_1.TestEmailDto, Object]),
    __metadata("design:returntype", void 0)
], EmailController.prototype, "test", null);
exports.EmailController = EmailController = __decorate([
    (0, common_1.Controller)('admin/email-settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map