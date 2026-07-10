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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let RefreshTokenService = class RefreshTokenService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async createSession(userId, req, tx) {
        const prisma = tx ?? this.prisma;
        const refreshToken = this.generateRefreshToken();
        const refreshTokenHash = this.hashRefreshToken(refreshToken);
        const refreshTokenMaxAgeMs = this.getRefreshTokenTtlMs();
        const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenMaxAgeMs);
        const session = await prisma.refreshSession.create({
            data: {
                userId,
                refreshTokenHash,
                userAgent: this.extractUserAgent(req),
                ipAddress: this.extractIpAddress(req),
                expiresAt: refreshTokenExpiresAt,
            },
        });
        return {
            refreshToken,
            refreshTokenMaxAgeMs,
            refreshTokenExpiresAt,
            refreshSessionId: session.id,
        };
    }
    async rotateRefreshToken(refreshToken, req) {
        const oldHash = this.hashRefreshToken(refreshToken);
        const existingSession = await this.prisma.refreshSession.findUnique({
            where: { refreshTokenHash: oldHash },
            include: { user: true },
        });
        if (!existingSession) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (existingSession.revokedAt) {
            await this.revokeActiveSessionsForUser(existingSession.userId, 'REUSE_DETECTED');
            throw new common_1.UnauthorizedException('Refresh token has been revoked');
        }
        if (existingSession.expiresAt <= new Date()) {
            await this.prisma.refreshSession.updateMany({
                where: {
                    id: existingSession.id,
                    revokedAt: null,
                },
                data: {
                    revokedAt: new Date(),
                    revokedReason: 'EXPIRED',
                },
            });
            throw new common_1.UnauthorizedException('Refresh token has expired');
        }
        if (!existingSession.user.isActive) {
            throw new common_1.UnauthorizedException('User is inactive');
        }
        const newRefreshToken = this.generateRefreshToken();
        const newRefreshTokenHash = this.hashRefreshToken(newRefreshToken);
        const refreshTokenMaxAgeMs = this.getRefreshTokenTtlMs();
        const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenMaxAgeMs);
        const now = new Date();
        const result = await this.prisma.$transaction(async (tx) => {
            const revokeResult = await tx.refreshSession.updateMany({
                where: {
                    id: existingSession.id,
                    revokedAt: null,
                    expiresAt: {
                        gt: now,
                    },
                },
                data: {
                    revokedAt: now,
                    revokedReason: 'ROTATED',
                    lastUsedAt: now,
                },
            });
            if (revokeResult.count !== 1) {
                throw new common_1.UnauthorizedException('Refresh token is no longer valid');
            }
            const newSession = await tx.refreshSession.create({
                data: {
                    userId: existingSession.userId,
                    refreshTokenHash: newRefreshTokenHash,
                    userAgent: this.extractUserAgent(req),
                    ipAddress: this.extractIpAddress(req),
                    expiresAt: refreshTokenExpiresAt,
                    lastUsedAt: now,
                },
            });
            await tx.refreshSession.update({
                where: { id: existingSession.id },
                data: {
                    replacedBySessionId: newSession.id,
                },
            });
            return newSession;
        });
        return {
            user: existingSession.user,
            refreshToken: newRefreshToken,
            refreshTokenMaxAgeMs,
            refreshTokenExpiresAt,
            refreshSessionId: result.id,
        };
    }
    async revokeByToken(refreshToken, reason = 'LOGOUT') {
        const hash = this.hashRefreshToken(refreshToken);
        await this.prisma.refreshSession.updateMany({
            where: {
                refreshTokenHash: hash,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
                revokedReason: reason,
            },
        });
    }
    async revokeAllUserSessions(userId, reason = 'LOGOUT_ALL') {
        const result = await this.prisma.refreshSession.updateMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                revokedAt: new Date(),
                revokedReason: reason,
            },
        });
        return result.count;
    }
    async listUserSessions(userId, currentRefreshToken) {
        const currentHash = currentRefreshToken
            ? this.hashRefreshToken(currentRefreshToken)
            : null;
        const sessions = await this.prisma.refreshSession.findMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
        });
        return sessions.map((session) => ({
            id: session.id,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
            expiresAt: session.expiresAt,
            current: currentHash
                ? session.refreshTokenHash === currentHash
                : false,
        }));
    }
    async revokeUserSession(userId, sessionId, currentRefreshToken) {
        const session = await this.prisma.refreshSession.findFirst({
            where: {
                id: sessionId,
                userId,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const currentHash = currentRefreshToken
            ? this.hashRefreshToken(currentRefreshToken)
            : null;
        await this.prisma.refreshSession.updateMany({
            where: {
                id: sessionId,
                userId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
                revokedReason: 'SESSION_REVOKED',
            },
        });
        return {
            revokedCurrentSession: currentHash
                ? session.refreshTokenHash === currentHash
                : false,
        };
    }
    async revokeActiveSessionsForUser(userId, reason) {
        await this.prisma.refreshSession.updateMany({
            where: {
                userId,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                revokedAt: new Date(),
                revokedReason: reason,
            },
        });
    }
    generateRefreshToken() {
        return (0, crypto_1.randomBytes)(64).toString('base64url');
    }
    hashRefreshToken(refreshToken) {
        return (0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex');
    }
    getRefreshTokenTtlMs() {
        const value = this.config.get('REFRESH_TOKEN_EXPIRES_IN', '30d');
        return this.parseDurationToMs(value);
    }
    parseDurationToMs(value) {
        const match = value.match(/^(\d+)([smhdw])$/);
        if (!match) {
            return 30 * 24 * 60 * 60 * 1000;
        }
        const amount = Number(match[1]);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };
        return amount * multipliers[unit];
    }
    extractUserAgent(req) {
        const value = req?.headers['user-agent'];
        if (!value) {
            return null;
        }
        return Array.isArray(value) ? value.join(' ') : value;
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
exports.RefreshTokenService = RefreshTokenService;
exports.RefreshTokenService = RefreshTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], RefreshTokenService);
//# sourceMappingURL=refresh-token.service.js.map