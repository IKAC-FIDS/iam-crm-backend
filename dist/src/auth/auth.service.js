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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const http_log_context_1 = require("../common/logging/http-log-context");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const refresh_token_service_1 = require("./refresh-token.service");
const organization_memberships_service_1 = require("../organization-memberships/organization-memberships.service");
const tenant_resolver_service_1 = require("../organization-memberships/tenant-resolver.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, refreshTokenService, config, memberships, tenantResolver, audit) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.config = config;
        this.memberships = memberships;
        this.tenantResolver = tenantResolver;
        this.audit = audit;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(dto, req) {
        this.logger.log('Login attempt received', JSON.stringify(this.buildAuthLogContext(dto.email, req)));
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        this.logger.log('Login user lookup completed', JSON.stringify({
            ...this.buildAuthLogContext(dto.email, req),
            found: Boolean(user),
        }));
        if (!user || !user.isActive) {
            this.logger.warn(user ? 'Login rejected: user is inactive' : 'Login rejected: user not found', JSON.stringify(this.buildAuthLogContext(dto.email, req)));
            await this.audit.record({
                actorId: user?.id ?? null,
                actorType: user ? client_1.AuditActorType.USER : client_1.AuditActorType.ANONYMOUS,
                entityType: 'authentication',
                action: 'auth.login.failed',
                source: client_1.AuditSource.AUTH,
                result: client_1.AuditResult.FAILURE,
                errorCode: user ? 'ACCOUNT_INACTIVE' : 'INVALID_CREDENTIALS',
                metadata: { identifierFingerprint: this.identifierFingerprint(dto.email) },
            });
            throw new common_1.UnauthorizedException('ایمیل یا رمز عبور نادرست است');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            this.logger.warn('Login rejected: user account is locked', JSON.stringify(this.buildAuthLogContext(dto.email, req)));
            throw new common_1.UnauthorizedException('حساب کاربری موقتاً قفل شده است. لطفاً بعداً دوباره تلاش کنید');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            this.logger.warn('Login password verification failed', JSON.stringify(this.buildAuthLogContext(dto.email, req)));
            await this.recordFailedLogin(user.id, user.failedLoginAttempts);
            throw new common_1.UnauthorizedException('ایمیل یا رمز عبور نادرست است');
        }
        this.logger.log('Login password verification succeeded', JSON.stringify(this.buildAuthLogContext(dto.email, req)));
        const tenant = await this.resolveLoginContext(user.id, this.requestId(req));
        if (tenant) {
            const settings = await this.prisma.organizationSettings.findUnique({
                where: { organizationId: tenant.organizationId },
                select: { allowPasswordLogin: true },
            });
            if (settings?.allowPasswordLogin === false) {
                throw new common_1.ForbiddenException('Password login is disabled for this Organization');
            }
        }
        await this.recordSuccessfulLogin(user.id, req, tenant);
        return this.buildSessionLoginResponse(user, req, tenant);
    }
    async refresh(refreshToken, req) {
        const activeSession = await this.refreshTokenService.getActiveSession(refreshToken);
        const refreshContext = activeSession.tenantContext;
        const effective = refreshContext && !('platformOnly' in refreshContext)
            ? await this.tenantResolver.resolveAuthenticatedTenant(activeSession.user.id, {
                claims: refreshContext,
                requestId: this.requestId(req),
            })
            : await this.resolveLoginContext(activeSession.user.id, this.requestId(req), Boolean(refreshContext && 'platformOnly' in refreshContext));
        const rotated = await this.refreshTokenService.rotateRefreshToken(refreshToken, req, effective
            ? {
                activeOrganizationId: effective.organizationId,
                membershipId: effective.membershipId,
            }
            : { platformOnly: true });
        const accessResponse = await this.buildLoginResponse(rotated.user, effective);
        return {
            ...accessResponse,
            refreshToken: rotated.refreshToken,
            refreshTokenMaxAgeMs: rotated.refreshTokenMaxAgeMs,
            refreshTokenExpiresAt: rotated.refreshTokenExpiresAt,
            refreshSessionId: rotated.refreshSessionId,
        };
    }
    async logout(refreshToken) {
        if (!refreshToken) {
            return;
        }
        await this.refreshTokenService.revokeByToken(refreshToken, 'LOGOUT');
    }
    async logoutAll(userId) {
        const revokedCount = await this.refreshTokenService.revokeAllUserSessions(userId, 'LOGOUT_ALL');
        return { revokedCount };
    }
    async buildSessionLoginResponse(user, req, resolved) {
        const context = this.buildAuthLogContext(user.email, req);
        this.logger.log('Login token generation started', JSON.stringify(context));
        try {
            const effective = resolved === undefined
                ? await this.resolveLoginContext(user.id, this.requestId(req))
                : resolved;
            const accessResponse = await this.buildLoginResponse(user, effective);
            const refreshSession = await this.refreshTokenService.createSession(user.id, req, undefined, effective
                ? {
                    activeOrganizationId: effective.organizationId,
                    membershipId: effective.membershipId,
                }
                : { platformOnly: true });
            this.logger.log('Login token generation succeeded', JSON.stringify(context));
            return { ...accessResponse, ...refreshSession };
        }
        catch (error) {
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error('Login token generation failed', stack, JSON.stringify(context));
            throw error;
        }
    }
    async buildLoginResponse(user, resolved) {
        const effective = resolved === undefined ? await this.resolveLoginContext(user.id) : resolved;
        const effectiveRole = effective?.role ?? user.role;
        const effectiveRoleId = effective?.roleId ?? user.roleId;
        const assignedRole = effectiveRoleId
            ? await this.prisma.role.findUnique({ where: { id: effectiveRoleId } })
            : null;
        const payload = {
            sub: user.id,
            email: user.email,
            role: effectiveRole,
            team: effective?.team ?? null,
            teamId: effective?.teamId ?? null,
            teamCode: effective?.teamCode ?? null,
            teamName: effective?.teamName ?? null,
            ...(effective && {
                organizationId: effective.organizationId,
                activeOrganizationId: effective.organizationId,
                membershipId: effective.membershipId,
            }),
        };
        await this.memberships.touchLastAccess(effective?.membershipId ?? null);
        return {
            accessToken: await this.jwtService.signAsync(payload),
            accessTokenExpiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: effectiveRole,
                team: effective?.team ?? null,
                teamId: effective?.teamId ?? null,
                teamCode: effective?.teamCode ?? null,
                teamName: effective?.teamName ?? null,
                organizationId: effective?.organizationId ?? null,
                permissions: effective ? [...effective.permissions] : [],
                roleId: assignedRole?.id ?? null,
                roleCode: assignedRole?.code ?? effectiveRole,
                roleName: assignedRole?.name ?? effectiveRole,
                avatarObjectKey: user.avatarObjectKey,
            },
        };
    }
    async resolveLoginContext(userId, requestId, platformOnly = false) {
        if (!platformOnly) {
            try {
                return await this.tenantResolver.resolveAuthenticatedTenant(userId, {
                    claims: undefined,
                    requestId,
                });
            }
            catch (error) {
                const authority = await this.prisma.platformAuthority.findUnique({
                    where: { userId },
                    select: { role: true, user: { select: { isActive: true } } },
                });
                if (authority?.user.isActive && authority.role === 'PLATFORM_ADMIN') {
                    return null;
                }
                throw error;
            }
        }
        const authority = await this.prisma.platformAuthority.findUnique({
            where: { userId },
            select: { role: true, user: { select: { isActive: true } } },
        });
        if (!authority?.user.isActive || authority.role !== 'PLATFORM_ADMIN') {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        return null;
    }
    async switchTenant(user, organizationId, refreshToken, req) {
        const requestId = this.requestId(req);
        try {
            const activeSession = await this.refreshTokenService.getActiveSession(refreshToken);
            if (activeSession.user.id !== user.userId) {
                throw new common_1.ForbiddenException('Tenant selection is not permitted');
            }
            const current = await this.tenantResolver.resolveAuthenticatedTenant(user.userId, {
                claims: activeSession.tenantContext &&
                    !('platformOnly' in activeSession.tenantContext)
                    ? activeSession.tenantContext
                    : undefined,
                requestId,
            });
            if (user.tenantContext &&
                (current.organizationId !== user.tenantContext.organizationId ||
                    current.membershipId !== user.tenantContext.membershipId)) {
                throw new common_1.ForbiddenException('Tenant selection is not permitted');
            }
            const selected = await this.tenantResolver.selectTenant(user.userId, organizationId, requestId);
            const rotated = await this.refreshTokenService.rotateRefreshToken(refreshToken, req, {
                activeOrganizationId: selected.organizationId,
                membershipId: selected.membershipId,
            });
            const accessResponse = await this.buildLoginResponse(activeSession.user, selected);
            await this.audit
                .record({
                actorId: user.userId,
                organizationId: selected.organizationId,
                entityType: 'organization-membership',
                entityId: selected.membershipId,
                action: 'tenant.switched',
                requestId,
                metadata: {
                    previousMembershipId: current.membershipId,
                    newMembershipId: selected.membershipId,
                },
            })
                .catch((auditError) => {
                this.logger.error(`Tenant switch audit failed requestId=${requestId ?? 'none'}`, auditError instanceof Error ? auditError.stack : undefined);
            });
            return {
                ...accessResponse,
                refreshToken: rotated.refreshToken,
                refreshTokenMaxAgeMs: rotated.refreshTokenMaxAgeMs,
                refreshTokenExpiresAt: rotated.refreshTokenExpiresAt,
                refreshSessionId: rotated.refreshSessionId,
            };
        }
        catch (error) {
            await this.audit
                .record({
                actorId: user.userId,
                entityType: 'tenant-session',
                action: 'tenant.switch-rejected',
                requestId,
                metadata: { reason: 'candidate-not-authorized' },
            })
                .catch(() => undefined);
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            throw new common_1.ForbiddenException('Tenant selection is not permitted');
        }
    }
    toPublicAuthResponse(result) {
        const { refreshToken, refreshTokenMaxAgeMs, refreshTokenExpiresAt, refreshSessionId, tenantContext, ...publicResponse } = result;
        void refreshToken;
        void refreshTokenMaxAgeMs;
        void refreshTokenExpiresAt;
        void refreshSessionId;
        void tenantContext;
        return publicResponse;
    }
    async recordFailedLogin(userId, currentFailedAttempts) {
        const nextFailedAttempts = currentFailedAttempts + 1;
        const shouldLock = nextFailedAttempts >= 5;
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: nextFailedAttempts,
                lockedUntil: shouldLock
                    ? new Date(Date.now() + 15 * 60 * 1000)
                    : null,
            },
        });
        await this.audit.record({
            actorId: userId,
            entityType: 'authentication',
            entityId: userId,
            action: 'auth.login.failed',
            source: client_1.AuditSource.AUTH,
            result: client_1.AuditResult.FAILURE,
            errorCode: shouldLock ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
            metadata: { failedAttemptCount: nextFailedAttempts },
        });
    }
    async recordSuccessfulLogin(userId, req, tenant) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
                lastLoginIp: this.extractIpAddress(req),
            },
        });
        await this.audit.record({
            actorId: userId,
            organizationId: tenant?.organizationId ?? null,
            actorMembershipId: tenant?.membershipId ?? null,
            entityType: 'authentication',
            entityId: userId,
            action: 'auth.login.success',
            source: client_1.AuditSource.AUTH,
            result: client_1.AuditResult.SUCCESS,
        });
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
    buildAuthLogContext(email, req) {
        if (!req) {
            return { email, requestId: null, origin: null, userAgent: null };
        }
        const context = (0, http_log_context_1.buildHttpLogContext)(req);
        return {
            email,
            requestId: context.requestId,
            origin: context.origin,
            userAgent: context.userAgent,
        };
    }
    identifierFingerprint(identifier) {
        return `sha256:${(0, node_crypto_1.createHash)('sha256').update(identifier.trim().toLowerCase()).digest('hex')}`;
    }
    requestId(req) {
        return req?.requestId ?? null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        refresh_token_service_1.RefreshTokenService,
        config_1.ConfigService,
        organization_memberships_service_1.OrganizationMembershipsService,
        tenant_resolver_service_1.TenantResolverService,
        audit_log_service_1.AuditLogService])
], AuthService);
//# sourceMappingURL=auth.service.js.map