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
exports.AccountSecurityController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const refresh_token_cookie_1 = require("../common/cookies/refresh-token-cookie");
const account_security_service_1 = require("./account-security.service");
const change_password_dto_1 = require("./dto/change-password.dto");
let AccountSecurityController = class AccountSecurityController {
    constructor(accountSecurityService) {
        this.accountSecurityService = accountSecurityService;
    }
    getSecurityOverview(user) {
        return this.accountSecurityService.getSecurityOverview(user.userId);
    }
    async changePassword(user, dto, res) {
        const result = await this.accountSecurityService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
        (0, refresh_token_cookie_1.clearRefreshTokenCookie)(res);
        return result;
    }
    async logoutOtherSessions(user, req) {
        const currentRefreshToken = (0, refresh_token_cookie_1.getRefreshTokenFromRequest)(req);
        return this.accountSecurityService.logoutOtherSessions(user.userId, currentRefreshToken);
    }
};
exports.AccountSecurityController = AccountSecurityController;
__decorate([
    (0, common_1.Get)('security'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountSecurityController.prototype, "getSecurityOverview", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AccountSecurityController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('logout-other-sessions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AccountSecurityController.prototype, "logoutOtherSessions", null);
exports.AccountSecurityController = AccountSecurityController = __decorate([
    (0, common_1.Controller)('auth/account'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [account_security_service_1.AccountSecurityService])
], AccountSecurityController);
//# sourceMappingURL=account-security.controller.js.map