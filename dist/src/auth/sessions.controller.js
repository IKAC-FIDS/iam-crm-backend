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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const refresh_token_cookie_1 = require("../common/cookies/refresh-token-cookie");
const sessions_service_1 = require("./sessions.service");
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async listMySessions(user, req) {
        const currentRefreshToken = (0, refresh_token_cookie_1.getRefreshTokenFromRequest)(req);
        return this.sessionsService.listMySessions(user.userId, currentRefreshToken);
    }
    async revokeMySession(user, sessionId, req, res) {
        const currentRefreshToken = (0, refresh_token_cookie_1.getRefreshTokenFromRequest)(req);
        const result = await this.sessionsService.revokeMySession(user.userId, sessionId, currentRefreshToken);
        if (result.revokedCurrentSession) {
            (0, refresh_token_cookie_1.clearRefreshTokenCookie)(res);
        }
        return {
            success: true,
            ...result,
        };
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "listMySessions", null);
__decorate([
    (0, common_1.Delete)(':sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "revokeMySession", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('auth/sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map