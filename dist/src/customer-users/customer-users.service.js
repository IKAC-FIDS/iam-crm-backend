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
exports.CustomerUsersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const customer_access_service_1 = require("../customer-access/customer-access.service");
const email_service_1 = require("../email/email.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomerUsersService = class CustomerUsersService {
    constructor(prisma, access, audit, email, config) {
        this.prisma = prisma;
        this.access = access;
        this.audit = audit;
        this.email = email;
        this.config = config;
    }
    async portalCompanySummary(companyId, organizationId, role) {
        const company = await this.access.assertCompany(companyId, organizationId);
        if (!company.portalEnabled)
            throw new common_1.ForbiddenException('دسترسی پرتال این شرکت غیرفعال است');
        return {
            id: company.id,
            legalName: company.legalName,
            brandName: company.brandName,
            role,
        };
    }
    async overview(companyId, organizationId) {
        const company = await this.access.assertCompany(companyId, organizationId);
        const [memberships, invitations] = await Promise.all([
            this.prisma.customerCompanyMembership.findMany({ where: { companyId, organizationId }, include: { user: { select: { id: true, fullName: true, email: true, isActive: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.customerInvitation.findMany({ where: { companyId, organizationId, acceptedAt: null, revokedAt: null, replacedByInvitationId: null, expiresAt: { gt: new Date() } }, select: { id: true, normalizedEmail: true, role: true, expiresAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
        ]);
        return { portalEnabled: company.portalEnabled, portalEnabledAt: company.portalEnabledAt, memberships, invitations };
    }
    async setPortalEnabled(companyId, organizationId, enabled, actorId) {
        const company = await this.access.assertCompany(companyId, organizationId);
        if (company.portalEnabled === enabled)
            return this.overview(companyId, organizationId);
        await this.prisma.$transaction(async (tx) => {
            await tx.company.update({ where: { id: companyId }, data: { portalEnabled: enabled, portalEnabledAt: enabled ? new Date() : null, portalEnabledById: actorId } });
            if (!enabled) {
                const ids = (await tx.customerCompanyMembership.findMany({ where: { companyId, organizationId }, select: { id: true } })).map(x => x.id);
                if (ids.length)
                    await tx.refreshSession.updateMany({ where: { activeCustomerMembershipId: { in: ids }, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'COMPANY_PORTAL_DISABLED' } });
            }
            await this.audit.record({ actorId, organizationId, entityType: 'company-portal', entityId: companyId, action: enabled ? 'company.portal_enabled' : 'company.portal_disabled', before: { portalEnabled: company.portalEnabled }, after: { portalEnabled: enabled } }, tx);
        });
        return this.overview(companyId, organizationId);
    }
    async invite(companyId, organizationId, email, role, actorId) {
        const company = await this.access.assertCompany(companyId, organizationId);
        if (!company.portalEnabled)
            throw new common_1.ConflictException('ابتدا دسترسی پرتال شرکت را فعال کنید');
        const normalizedEmail = this.normalize(email);
        const existingUser = await this.prisma.user.findUnique({ where: { normalizedEmail } });
        if (existingUser?.principalType === client_1.UserPrincipalType.INTERNAL)
            throw new common_1.ConflictException('این ایمیل متعلق به کاربر داخلی سامانه است');
        if (existingUser) {
            const membership = await this.prisma.customerCompanyMembership.findUnique({ where: { companyId_userId: { companyId, userId: existingUser.id } } });
            if (membership?.status === client_1.CustomerMembershipStatus.ACTIVE)
                throw new common_1.ConflictException('این کاربر هم‌اکنون عضو فعال شرکت است');
        }
        const rawToken = (0, node_crypto_1.randomBytes)(48).toString('base64url');
        const id = (0, node_crypto_1.randomUUID)();
        const now = new Date();
        const invitation = await this.prisma.$transaction(async (tx) => {
            const pending = await tx.customerInvitation.findMany({ where: { companyId, normalizedEmail, acceptedAt: null, revokedAt: null, replacedByInvitationId: null } });
            if (pending.length)
                await tx.customerInvitation.updateMany({ where: { id: { in: pending.map(x => x.id) } }, data: { revokedAt: now, replacedByInvitationId: id } });
            const created = await tx.customerInvitation.create({ data: { id, organizationId, companyId, normalizedEmail, role, tokenHash: (0, node_crypto_1.createHash)('sha256').update(rawToken).digest('hex'), invitedById: actorId, expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000) } });
            await this.audit.record({ actorId, organizationId, entityType: 'customer-invitation', entityId: created.id, action: 'customer.invited', metadata: { companyId, recipientFingerprint: (0, node_crypto_1.createHash)('sha256').update(normalizedEmail).digest('hex'), role } }, tx);
            return created;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        const baseUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
        await this.email.send(organizationId, { to: normalizedEmail, subject: `دعوت به پرتال ${company.brandName || company.legalName}`, text: `برای فعال‌سازی حساب پرتال از این پیوند استفاده کنید:\n${baseUrl}/portal/invitation/${encodeURIComponent(rawToken)}\nاین پیوند تا ۷۲ ساعت معتبر است.` });
        return { id: invitation.id, email: normalizedEmail, role, expiresAt: invitation.expiresAt };
    }
    async resend(companyId, organizationId, invitationId, actorId) {
        const current = await this.prisma.customerInvitation.findFirst({ where: { id: invitationId, companyId, organizationId, acceptedAt: null, revokedAt: null } });
        if (!current)
            throw new common_1.NotFoundException('Invitation not found');
        return this.invite(companyId, organizationId, current.normalizedEmail, current.role, actorId);
    }
    async revokeInvitation(companyId, organizationId, invitationId, actorId) {
        const result = await this.prisma.customerInvitation.updateMany({ where: { id: invitationId, companyId, organizationId, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
        if (!result.count)
            throw new common_1.NotFoundException('Invitation not found');
        await this.audit.record({ actorId, organizationId, entityType: 'customer-invitation', entityId: invitationId, action: 'customer.invitation_revoked' });
        return { success: true };
    }
    async updateMembership(companyId, organizationId, membershipId, input, actorId, customerActor = false) {
        if (input.status === client_1.CustomerMembershipStatus.INVITED)
            throw new common_1.BadRequestException('Invalid membership status');
        const membership = await this.prisma.customerCompanyMembership.findFirst({ where: { id: membershipId, companyId, organizationId } });
        if (!membership)
            throw new common_1.NotFoundException('Membership not found');
        if (customerActor && input.status === client_1.CustomerMembershipStatus.REVOKED && membership.userId === actorId)
            throw new common_1.ForbiddenException('نمی‌توانید دسترسی خود را لغو کنید');
        await this.prisma.$transaction(async (tx) => {
            const removesAdmin = membership.role === client_1.CustomerRole.CUSTOMER_ADMIN && membership.status === client_1.CustomerMembershipStatus.ACTIVE && (input.role === client_1.CustomerRole.CUSTOMER_USER || (input.status && input.status !== client_1.CustomerMembershipStatus.ACTIVE));
            if (removesAdmin)
                await this.assertAnotherAdmin(tx, companyId, membership.id);
            const now = new Date();
            await tx.customerCompanyMembership.update({ where: { id: membership.id }, data: { ...(input.role && { role: input.role }), ...(input.status && { status: input.status, activatedAt: input.status === client_1.CustomerMembershipStatus.ACTIVE ? now : membership.activatedAt, suspendedAt: input.status === client_1.CustomerMembershipStatus.SUSPENDED ? now : null, revokedAt: input.status === client_1.CustomerMembershipStatus.REVOKED ? now : null }) } });
            if (input.status && input.status !== client_1.CustomerMembershipStatus.ACTIVE)
                await tx.refreshSession.updateMany({ where: { activeCustomerMembershipId: membership.id, revokedAt: null }, data: { revokedAt: now, revokedReason: `CUSTOMER_MEMBERSHIP_${input.status}` } });
            await this.audit.record({ actorId, organizationId, entityType: 'customer-membership', entityId: membership.id, action: 'customer.membership_updated', before: { role: membership.role, status: membership.status }, after: input }, tx);
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        return this.overview(companyId, organizationId);
    }
    async assertAnotherAdmin(tx, companyId, excludedId) {
        const count = await tx.customerCompanyMembership.count({ where: { companyId, id: { not: excludedId }, role: client_1.CustomerRole.CUSTOMER_ADMIN, status: client_1.CustomerMembershipStatus.ACTIVE } });
        if (!count)
            throw new common_1.ConflictException('آخرین مدیر فعال پرتال را نمی‌توان حذف، تعلیق یا تنزل داد');
    }
    normalize(email) { return email.trim().toLowerCase(); }
};
exports.CustomerUsersService = CustomerUsersService;
exports.CustomerUsersService = CustomerUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, customer_access_service_1.CustomerAccessService, audit_log_service_1.AuditLogService, email_service_1.EmailService, config_1.ConfigService])
], CustomerUsersService);
//# sourceMappingURL=customer-users.service.js.map