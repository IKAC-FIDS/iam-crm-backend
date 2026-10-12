import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomerMembershipStatus, CustomerRole, Prisma, UserPrincipalType } from '@prisma/client';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CustomerAccessService } from '../customer-access/customer-access.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerUsersService {
  constructor(private readonly prisma: PrismaService, private readonly access: CustomerAccessService, private readonly audit: AuditLogService, private readonly email: EmailService, private readonly config: ConfigService) {}

  async portalCompanySummary(companyId: string, organizationId: string, role: CustomerRole) {
    const company = await this.access.assertCompany(companyId, organizationId);
    if (!company.portalEnabled) throw new ForbiddenException('دسترسی پرتال این شرکت غیرفعال است');
    return {
      id: company.id,
      legalName: company.legalName,
      brandName: company.brandName,
      role,
    };
  }

  async overview(companyId: string, organizationId: string) {
    const company = await this.access.assertCompany(companyId, organizationId);
    const [memberships, invitations] = await Promise.all([
      this.prisma.customerCompanyMembership.findMany({ where: { companyId, organizationId }, include: { user: { select: { id: true, fullName: true, email: true, isActive: true } } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.customerInvitation.findMany({ where: { companyId, organizationId, acceptedAt: null, revokedAt: null, replacedByInvitationId: null, expiresAt: { gt: new Date() } }, select: { id: true, normalizedEmail: true, role: true, expiresAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
    ]);
    return { portalEnabled: company.portalEnabled, portalEnabledAt: company.portalEnabledAt, memberships, invitations };
  }

  async setPortalEnabled(companyId: string, organizationId: string, enabled: boolean, actorId: string) {
    const company = await this.access.assertCompany(companyId, organizationId);
    if (company.portalEnabled === enabled) return this.overview(companyId, organizationId);
    await this.prisma.$transaction(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: { portalEnabled: enabled, portalEnabledAt: enabled ? new Date() : null, portalEnabledById: actorId } });
      if (!enabled) {
        const ids = (await tx.customerCompanyMembership.findMany({ where: { companyId, organizationId }, select: { id: true } })).map(x => x.id);
        if (ids.length) await tx.refreshSession.updateMany({ where: { activeCustomerMembershipId: { in: ids }, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'COMPANY_PORTAL_DISABLED' } });
      }
      await this.audit.record({ actorId, organizationId, entityType: 'company-portal', entityId: companyId, action: enabled ? 'company.portal_enabled' : 'company.portal_disabled', before: { portalEnabled: company.portalEnabled }, after: { portalEnabled: enabled } }, tx);
    });
    return this.overview(companyId, organizationId);
  }

  async invite(companyId: string, organizationId: string, email: string, role: CustomerRole, actorId: string) {
    const company = await this.access.assertCompany(companyId, organizationId);
    if (!company.portalEnabled) throw new ConflictException('ابتدا دسترسی پرتال شرکت را فعال کنید');
    const normalizedEmail = this.normalize(email);
    const existingUser = await this.prisma.user.findUnique({ where: { normalizedEmail } });
    if (existingUser?.principalType === UserPrincipalType.INTERNAL) throw new ConflictException('این ایمیل متعلق به کاربر داخلی سامانه است');
    if (existingUser) {
      const membership = await this.prisma.customerCompanyMembership.findUnique({ where: { companyId_userId: { companyId, userId: existingUser.id } } });
      if (membership?.status === CustomerMembershipStatus.ACTIVE) throw new ConflictException('این کاربر هم‌اکنون عضو فعال شرکت است');
    }
    const rawToken = randomBytes(48).toString('base64url');
    const id = randomUUID();
    const now = new Date();
    const invitation = await this.prisma.$transaction(async (tx) => {
      const pending = await tx.customerInvitation.findMany({ where: { companyId, normalizedEmail, acceptedAt: null, revokedAt: null, replacedByInvitationId: null } });
      if (pending.length) await tx.customerInvitation.updateMany({ where: { id: { in: pending.map(x => x.id) } }, data: { revokedAt: now, replacedByInvitationId: id } });
      const created = await tx.customerInvitation.create({ data: { id, organizationId, companyId, normalizedEmail, role, tokenHash: createHash('sha256').update(rawToken).digest('hex'), invitedById: actorId, expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000) } });
      await this.audit.record({ actorId, organizationId, entityType: 'customer-invitation', entityId: created.id, action: 'customer.invited', metadata: { companyId, recipientFingerprint: createHash('sha256').update(normalizedEmail).digest('hex'), role } }, tx);
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    const baseUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
    await this.email.send(organizationId, { to: normalizedEmail, subject: `دعوت به پرتال ${company.brandName || company.legalName}`, text: `برای فعال‌سازی حساب پرتال از این پیوند استفاده کنید:\n${baseUrl}/portal/invitation/${encodeURIComponent(rawToken)}\nاین پیوند تا ۷۲ ساعت معتبر است.` });
    return { id: invitation.id, email: normalizedEmail, role, expiresAt: invitation.expiresAt };
  }

  async resend(companyId: string, organizationId: string, invitationId: string, actorId: string) {
    const current = await this.prisma.customerInvitation.findFirst({ where: { id: invitationId, companyId, organizationId, acceptedAt: null, revokedAt: null } });
    if (!current) throw new NotFoundException('Invitation not found');
    return this.invite(companyId, organizationId, current.normalizedEmail, current.role, actorId);
  }

  async revokeInvitation(companyId: string, organizationId: string, invitationId: string, actorId: string) {
    const result = await this.prisma.customerInvitation.updateMany({ where: { id: invitationId, companyId, organizationId, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!result.count) throw new NotFoundException('Invitation not found');
    await this.audit.record({ actorId, organizationId, entityType: 'customer-invitation', entityId: invitationId, action: 'customer.invitation_revoked' });
    return { success: true };
  }

  async updateMembership(companyId: string, organizationId: string, membershipId: string, input: { role?: CustomerRole; status?: CustomerMembershipStatus }, actorId: string, customerActor = false) {
    if (input.status === CustomerMembershipStatus.INVITED) throw new BadRequestException('Invalid membership status');
    const membership = await this.prisma.customerCompanyMembership.findFirst({ where: { id: membershipId, companyId, organizationId } });
    if (!membership) throw new NotFoundException('Membership not found');
    if (customerActor && input.status === CustomerMembershipStatus.REVOKED && membership.userId === actorId) throw new ForbiddenException('نمی‌توانید دسترسی خود را لغو کنید');
    await this.prisma.$transaction(async (tx) => {
      const removesAdmin = membership.role === CustomerRole.CUSTOMER_ADMIN && membership.status === CustomerMembershipStatus.ACTIVE && (input.role === CustomerRole.CUSTOMER_USER || (input.status && input.status !== CustomerMembershipStatus.ACTIVE));
      if (removesAdmin) await this.assertAnotherAdmin(tx, companyId, membership.id);
      const now = new Date();
      await tx.customerCompanyMembership.update({ where: { id: membership.id }, data: { ...(input.role && { role: input.role }), ...(input.status && { status: input.status, activatedAt: input.status === CustomerMembershipStatus.ACTIVE ? now : membership.activatedAt, suspendedAt: input.status === CustomerMembershipStatus.SUSPENDED ? now : null, revokedAt: input.status === CustomerMembershipStatus.REVOKED ? now : null }) } });
      if (input.status && input.status !== CustomerMembershipStatus.ACTIVE) await tx.refreshSession.updateMany({ where: { activeCustomerMembershipId: membership.id, revokedAt: null }, data: { revokedAt: now, revokedReason: `CUSTOMER_MEMBERSHIP_${input.status}` } });
      await this.audit.record({ actorId, organizationId, entityType: 'customer-membership', entityId: membership.id, action: 'customer.membership_updated', before: { role: membership.role, status: membership.status }, after: input }, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.overview(companyId, organizationId);
  }

  private async assertAnotherAdmin(tx: Prisma.TransactionClient, companyId: string, excludedId: string) {
    const count = await tx.customerCompanyMembership.count({ where: { companyId, id: { not: excludedId }, role: CustomerRole.CUSTOMER_ADMIN, status: CustomerMembershipStatus.ACTIVE } });
    if (!count) throw new ConflictException('آخرین مدیر فعال پرتال را نمی‌توان حذف، تعلیق یا تنزل داد');
  }
  private normalize(email: string) { return email.trim().toLowerCase(); }
}
