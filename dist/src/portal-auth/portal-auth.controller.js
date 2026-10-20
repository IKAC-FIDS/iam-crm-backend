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
exports.PortalAuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const portal_refresh_token_cookie_1 = require("../common/cookies/portal-refresh-token-cookie");
const cookie_origin_guard_1 = require("../common/guards/cookie-origin.guard");
const current_portal_principal_decorator_1 = require("../customer-access/current-portal-principal.decorator");
const portal_jwt_auth_guard_1 = require("../customer-access/portal-jwt-auth.guard");
const portal_auth_dto_1 = require("./dto/portal-auth.dto");
const portal_auth_service_1 = require("./portal-auth.service");
let PortalAuthController = class PortalAuthController {
    constructor(service) {
        this.service = service;
    }
    async login(dto, req, res) {
        return this.respond(await this.service.login(dto, req), res);
    }
    async select(dto, req, res) {
        return this.respond(await this.service.selectCompany(dto.selectionToken, dto.companyId, req), res);
    }
    async refresh(req, res) {
        const token = (0, portal_refresh_token_cookie_1.getPortalRefreshToken)(req);
        if (!token)
            throw new common_1.UnauthorizedException('Refresh token is missing');
        return this.respond(await this.service.refresh(token, req), res);
    }
    async switchCompany(principal, dto, req, res) {
        const token = (0, portal_refresh_token_cookie_1.getPortalRefreshToken)(req);
        if (!token)
            throw new common_1.UnauthorizedException('Refresh token is missing');
        return this.respond(await this.service.switchCompany(principal, dto.companyId, token, req), res);
    }
    session(principal) { return principal; }
    companies(principal) { return this.service.companies(principal.userId); }
    async accept(dto, req, res) {
        return this.respond(await this.service.acceptInvitation(dto, req), res);
    }
    async logout(req, res) {
        await this.service.logout((0, portal_refresh_token_cookie_1.getPortalRefreshToken)(req));
        (0, portal_refresh_token_cookie_1.clearPortalRefreshToken)(res);
        return { success: true };
    }
    async logoutAll(principal, res) {
        const result = await this.service.logoutAll(principal.userId);
        (0, portal_refresh_token_cookie_1.clearPortalRefreshToken)(res);
        return { success: true, ...result };
    }
    respond(result, res) {
        if (result.refreshToken)
            (0, portal_refresh_token_cookie_1.setPortalRefreshToken)(res, result.refreshToken, result.refreshTokenMaxAgeMs);
        return this.service.publicResponse(result);
    }
};
exports.PortalAuthController = PortalAuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [portal_auth_dto_1.PortalLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('select-company'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [portal_auth_dto_1.PortalSelectCompanyDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "select", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('switch-company'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, portal_auth_dto_1.PortalSwitchCompanyDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "switchCompany", null);
__decorate([
    (0, common_1.Get)('session'),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalAuthController.prototype, "session", null);
__decorate([
    (0, common_1.Get)('companies'),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalAuthController.prototype, "companies", null);
__decorate([
    (0, common_1.Post)('accept-invitation'),
    (0, common_1.HttpCode)(200),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [portal_auth_dto_1.AcceptCustomerInvitationDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(200),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout-all'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PortalAuthController.prototype, "logoutAll", null);
exports.PortalAuthController = PortalAuthController = __decorate([
    (0, common_1.Controller)('portal/auth'),
    (0, common_1.UseGuards)(cookie_origin_guard_1.CookieOriginGuard),
    __metadata("design:paramtypes", [portal_auth_service_1.PortalAuthService])
], PortalAuthController);
//# sourceMappingURL=portal-auth.controller.js.map