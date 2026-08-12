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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const http_log_context_1 = require("../common/logging/http-log-context");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const refresh_token_cookie_1 = require("../common/cookies/refresh-token-cookie");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const switch_tenant_dto_1 = require("./dto/switch-tenant.dto");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async login(dto, req, res) {
        const result = await this.authService.login(dto, req);
        (0, refresh_token_cookie_1.setRefreshTokenCookie)(res, result.refreshToken, result.refreshTokenMaxAgeMs);
        const context = (0, http_log_context_1.buildHttpLogContext)(req, res);
        this.logger.log('Login refresh cookie set', JSON.stringify({
            requestId: context.requestId,
            origin: context.origin,
            userAgent: context.userAgent,
        }));
        return this.authService.toPublicAuthResponse(result);
    }
    async refresh(req, res) {
        const refreshToken = (0, refresh_token_cookie_1.getRefreshTokenFromRequest)(req);
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is missing');
        }
        const result = await this.authService.refresh(refreshToken, req);
        (0, refresh_token_cookie_1.setRefreshTokenCookie)(res, result.refreshToken, result.refreshTokenMaxAgeMs);
        return this.authService.toPublicAuthResponse(result);
    }
    async logout(req, res) {
        const refreshToken = (0, refresh_token_cookie_1.getRefreshTokenFromRequest)(req);
        await this.authService.logout(refreshToken);
        (0, refresh_token_cookie_1.clearRefreshTokenCookie)(res);
        return {
            success: true,
        };
    }
    async switchTenant(user, dto, req, res) {
        const refreshToken = (0, refresh_token_cookie_1.getRefreshTokenFromRequest)(req);
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is missing');
        }
        const result = await this.authService.switchTenant(user, dto.organizationId, refreshToken, req);
        (0, refresh_token_cookie_1.setRefreshTokenCookie)(res, result.refreshToken, result.refreshTokenMaxAgeMs);
        return this.authService.toPublicAuthResponse(result);
    }
    async logoutAll(user, res) {
        const result = await this.authService.logoutAll(user.userId);
        (0, refresh_token_cookie_1.clearRefreshTokenCookie)(res);
        return {
            success: true,
            ...result,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('switch-tenant'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, switch_tenant_dto_1.SwitchTenantDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "switchTenant", null);
__decorate([
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map