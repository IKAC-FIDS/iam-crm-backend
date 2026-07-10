"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountSecurityService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const refresh_token_service_1 = require("./refresh-token.service");
let AccountSecurityService = class AccountSecurityService {
    constructor(prisma, refreshTokenService) {
        this.prisma = prisma;
        this.refreshTokenService = refreshTokenService;
    }
    async getSecurityOverview(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
                passwordChangedAt: true,
                lastLoginAt: true,
                lastLoginIp: true,
                failedLoginAttempts: true,
                lockedUntil: true,
                createdAt: true,
            },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User is inactive');
        }
        const activeSessionsCount = await this.prisma.refreshSession.count({
            where: {
                userId,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        return {
            ...user,
            activeSessionsCount,
            isLocked: user.lockedUntil ? user.lockedUntil > new Date() : false,
        };
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (currentPassword === newPassword) {
            throw new common_1.BadRequestException('رمز عبور جدید نباید با رمز عبور فعلی یکسان باشد');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User is inactive');
        }
        const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!currentPasswordValid) {
            throw new common_1.UnauthorizedException('رمز عبور فعلی نادرست است');
        }
        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newPasswordHash,
                passwordChangedAt: new Date(),
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
        await this.refreshTokenService.revokeAllUserSessions(userId, 'PASSWORD_CHANGED');
        return {
            success: true,
            message: 'رمز عبور با موفقیت تغییر کرد. لطفاً دوباره وارد شوید.',
            requiresLogin: true,
        };
    }
    async logoutOtherSessions(userId, currentRefreshToken) {
        if (!currentRefreshToken) {
            const revokedCount = await this.refreshTokenService.revokeAllUserSessions(userId, 'LOGOUT_OTHER_SESSIONS_NO_CURRENT_TOKEN');
            return {
                success: true,
                revokedCount,
                currentSessionKept: false,
            };
        }
        const revokedCount = await this.refreshTokenService.revokeAllUserSessionsExceptToken(userId, currentRefreshToken, 'LOGOUT_OTHER_SESSIONS');
        return {
            success: true,
            revokedCount,
            currentSessionKept: true,
        };
    }
    extractIpAddress(req) {
        const forwardedFor = req?.headers['x-forwarded-for'];
        if (Array.isArray(forwardedFor)) {
            return forwardedFor[0]?.split(',')[0]?.trim() || null;
        }
        if (typeof forwardedFor === 'string') {
            return forwardedFor.split(',')[0]?.trim() || null;
        }
        return req?.ip || req?.socket?.remoteAddress || null;
    }
};
exports.AccountSecurityService = AccountSecurityService;
exports.AccountSecurityService = AccountSecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        refresh_token_service_1.RefreshTokenService])
], AccountSecurityService);
//# sourceMappingURL=account-security.service.js.map