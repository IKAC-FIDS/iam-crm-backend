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
exports.PortalAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const node_crypto_1 = require("node:crypto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const customer_access_service_1 = require("../customer-access/customer-access.service");
const prisma_service_1 = require("../prisma/prisma.service");
const refresh_token_service_1 = require("../auth/refresh-token.service");
let PortalAuthService = class PortalAuthService {
    constructor(prisma, jwt, config, refreshTokens, access, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.refreshTokens = refreshTokens;
        this.access = access;
        this.audit = audit;
    }
    async login(dto, req) {
        const normalizedEmail = this.normalize(dto.email);
        const user = await this.prisma.user.findUnique({ where: { normalizedEmail } });
        if (!user || !user.isActive || user.principalType !== client_1.UserPrincipalType.CUSTOMER || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('ایمیل یا رمز عبور نادرست است');
        }
        const memberships = await this.activeMemberships(user.id);
        if (!memberships.length)
            throw new common_1.ForbiddenException('هیچ شرکت فعال برای پرتال در دسترس نیست');
        const selected = dto.companyId
            ? memberships.find((item) => item.companyId === dto.companyId)
            : memberships.length === 1 ? memberships[0] : null;
        if (!selected) {
            return {
                requiresCompanySelection: true,
                selectionToken: await this.jwt.signAsync({ sub: user.id, principalType: 'CUSTOMER', purpose: 'portal-company-selection' }, { audience: 'neshane-op-portal-selection', expiresIn: '5m' }),
                companies: memberships.map(this.companyOption),
            };
        }
        return this.createSession(user, selected, req);
    }
    async selectCompany(selectionToken, companyId, req) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(selectionToken, { audience: 'neshane-op-portal-selection' });
        }
        catch {
            throw new common_1.UnauthorizedException('انتخاب شرکت منقضی یا نامعتبر است');
        }
        if (payload.principalType !== 'CUSTOMER' || payload.purpose !== 'portal-company-selection') {
            throw new common_1.UnauthorizedException('انتخاب شرکت نامعتبر است');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.principalType !== client_1.UserPrincipalType.CUSTOMER || !user.isActive)
            throw new common_1.UnauthorizedException();
        const membership = await this.prisma.customerCompanyMembership.findFirst({
            where: { userId: user.id, companyId, status: client_1.CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } },
            include: { company: true },
        });
        if (!membership)
            throw new common_1.ForbiddenException('شرکت انتخاب‌شده در دسترس نیست');
        return this.createSession(user, membership, req);
    }
    async refresh(token, req) {
        const session = await this.refreshTokens.getActiveSession(token, client_1.AuthSessionAudience.PORTAL);
        if (session.user.principalType !== client_1.UserPrincipalType.CUSTOMER || !session.tenantContext || !('portal' in session.tenantContext)) {
            throw new common_1.UnauthorizedException('Invalid portal refresh token');
        }
        const membership = await this.access.resolve(session.user.id, session.tenantContext.customerMembershipId);
        const context = this.context(membership);
        const rotated = await this.refreshTokens.rotateRefreshToken(token, req, context, client_1.AuthSessionAudience.PORTAL);
        return { ...(await this.accessResponse(session.user, membership)), ...rotated };
    }
    async switchCompany(principal, companyId, token, req) {
        const session = await this.refreshTokens.getActiveSession(token, client_1.AuthSessionAudience.PORTAL);
        if (session.user.id !== principal.userId)
            throw new common_1.UnauthorizedException();
        const membership = await this.prisma.customerCompanyMembership.findFirst({
            where: { userId: principal.userId, companyId, status: client_1.CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } },
            include: { company: true },
        });
        if (!membership)
            throw new common_1.ForbiddenException('شرکت انتخاب‌شده در دسترس نیست');
        const rotated = await this.refreshTokens.rotateRefreshToken(token, req, this.context(membership), client_1.AuthSessionAudience.PORTAL);
        await this.audit.record({ actorId: principal.userId, organizationId: membership.organizationId, entityType: 'customer-membership', entityId: membership.id, action: 'portal.company_switched', metadata: { previousMembershipId: principal.membershipId } });
        return { ...(await this.accessResponse(session.user, membership)), ...rotated };
    }
    async companies(userId) {
        return (await this.activeMemberships(userId)).map(this.companyOption);
    }
    async acceptInvitation(dto, req) {
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(dto.token).digest('hex');
        const invitation = await this.prisma.customerInvitation.findUnique({ where: { tokenHash }, include: { company: true } });
        if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.replacedByInvitationId || invitation.expiresAt <= new Date() || !invitation.company.portalEnabled || invitation.company.archivedAt) {
            throw new common_1.UnauthorizedException('دعوت‌نامه نامعتبر یا منقضی است');
        }
        let user = await this.prisma.user.findUnique({ where: { normalizedEmail: invitation.normalizedEmail } });
        if (user?.principalType === client_1.UserPrincipalType.INTERNAL)
            throw new common_1.ConflictException('این ایمیل متعلق به کاربر داخلی سامانه است');
        if (user && !(await bcrypt.compare(dto.password, user.passwordHash)))
            throw new common_1.UnauthorizedException('تأیید هویت ناموفق بود');
        const passwordHash = user ? user.passwordHash : await bcrypt.hash(dto.password, 12);
        const now = new Date();
        const result = await this.prisma.$transaction(async (tx) => {
            if (!user) {
                if (!dto.fullName)
                    throw new common_1.ConflictException('نام و نام خانوادگی برای حساب جدید الزامی است');
                user = await tx.user.create({
                    data: { fullName: dto.fullName.trim(), email: invitation.normalizedEmail, normalizedEmail: invitation.normalizedEmail, passwordHash, principalType: client_1.UserPrincipalType.CUSTOMER, organizationId: invitation.organizationId },
                });
            }
            const claimed = await tx.customerInvitation.updateMany({
                where: { id: invitation.id, acceptedAt: null, revokedAt: null, replacedByInvitationId: null, expiresAt: { gt: now } },
                data: { acceptedAt: now, acceptedById: user.id },
            });
            if (claimed.count !== 1)
                throw new common_1.ConflictException('دعوت‌نامه قبلاً استفاده شده است');
            const membership = await tx.customerCompanyMembership.upsert({
                where: { companyId_userId: { companyId: invitation.companyId, userId: user.id } },
                create: { organizationId: invitation.organizationId, companyId: invitation.companyId, userId: user.id, role: invitation.role, status: client_1.CustomerMembershipStatus.ACTIVE, invitedById: invitation.invitedById, invitedAt: invitation.createdAt, activatedAt: now },
                update: { role: invitation.role, status: client_1.CustomerMembershipStatus.ACTIVE, activatedAt: now, suspendedAt: null, revokedAt: null },
                include: { company: true },
            });
            return membership;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        await this.audit.record({ actorId: user.id, organizationId: result.organizationId, entityType: 'customer-invitation', entityId: invitation.id, action: 'customer.invitation_accepted' });
        return this.createSession(user, result, req);
    }
    async logout(token) { if (token)
        await this.refreshTokens.revokeByToken(token, 'PORTAL_LOGOUT'); }
    async logoutAll(userId) { return { revokedCount: await this.refreshTokens.revokeAllUserSessionsByAudience(userId, client_1.AuthSessionAudience.PORTAL, 'PORTAL_LOGOUT_ALL') }; }
    publicResponse(value) {
        const { refreshToken: _token, ...safe } = value;
        return safe;
    }
    async createSession(user, membership, req) {
        const context = this.context(membership);
        const session = await this.refreshTokens.createSession(user.id, req, undefined, context, client_1.AuthSessionAudience.PORTAL);
        await this.prisma.customerCompanyMembership.update({ where: { id: membership.id }, data: { lastAccessAt: new Date() } });
        return { ...(await this.accessResponse(user, membership)), ...session };
    }
    async accessResponse(user, membership) {
        return {
            accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, principalType: 'CUSTOMER', customerMembershipId: membership.id }, { audience: 'neshane-op-portal', expiresIn: this.config.get('JWT_EXPIRES_IN', '15m') }),
            accessTokenExpiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
            user: { id: user.id, fullName: user.fullName, email: user.email, principalType: 'CUSTOMER' },
            activeCompany: this.companyOption(membership),
        };
    }
    context(membership) {
        return { portal: true, activeOrganizationId: membership.organizationId, activeCompanyId: membership.companyId, customerMembershipId: membership.id };
    }
    activeMemberships(userId) {
        return this.prisma.customerCompanyMembership.findMany({ where: { userId, status: client_1.CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } }, include: { company: true }, orderBy: { company: { legalName: 'asc' } } });
    }
    companyOption(membership) {
        return { membershipId: membership.id, companyId: membership.companyId, legalName: membership.company.legalName, brandName: membership.company.brandName, role: membership.role };
    }
    normalize(email) { return email.trim().toLowerCase(); }
};
exports.PortalAuthService = PortalAuthService;
exports.PortalAuthService = PortalAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        refresh_token_service_1.RefreshTokenService,
        customer_access_service_1.CustomerAccessService,
        audit_log_service_1.AuditLogService])
], PortalAuthService);
//# sourceMappingURL=portal-auth.service.js.map