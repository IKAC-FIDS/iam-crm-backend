import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthSessionAudience, CustomerMembershipStatus, Prisma, UserPrincipalType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CustomerAccessService } from '../customer-access/customer-access.service';
import type { PortalPrincipal } from '../customer-access/portal-principal';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { AcceptCustomerInvitationDto, PortalLoginDto } from './dto/portal-auth.dto';

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly access: CustomerAccessService,
    private readonly audit: AuditLogService,
  ) {}

  async login(dto: PortalLoginDto, req?: Request) {
    const normalizedEmail = this.normalize(dto.email);
    const user = await this.prisma.user.findUnique({ where: { normalizedEmail } });
    if (!user || !user.isActive || user.principalType !== UserPrincipalType.CUSTOMER || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }
    const memberships = await this.activeMemberships(user.id);
    if (!memberships.length) throw new ForbiddenException('هیچ شرکت فعال برای پرتال در دسترس نیست');
    const selected = dto.companyId
      ? memberships.find((item) => item.companyId === dto.companyId)
      : memberships.length === 1 ? memberships[0] : null;
    if (!selected) {
      return {
        requiresCompanySelection: true,
        selectionToken: await this.jwt.signAsync(
          { sub: user.id, principalType: 'CUSTOMER', purpose: 'portal-company-selection' },
          { audience: 'neshane-op-portal-selection', expiresIn: '5m' },
        ),
        companies: memberships.map(this.companyOption),
      };
    }
    return this.createSession(user, selected, req);
  }

  async selectCompany(selectionToken: string, companyId: string, req?: Request) {
    let payload: { sub: string; principalType: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(selectionToken, { audience: 'neshane-op-portal-selection' });
    } catch {
      throw new UnauthorizedException('انتخاب شرکت منقضی یا نامعتبر است');
    }
    if (payload.principalType !== 'CUSTOMER' || payload.purpose !== 'portal-company-selection') {
      throw new UnauthorizedException('انتخاب شرکت نامعتبر است');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.principalType !== UserPrincipalType.CUSTOMER || !user.isActive) throw new UnauthorizedException();
    const membership = await this.prisma.customerCompanyMembership.findFirst({
      where: { userId: user.id, companyId, status: CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } },
      include: { company: true },
    });
    if (!membership) throw new ForbiddenException('شرکت انتخاب‌شده در دسترس نیست');
    return this.createSession(user, membership, req);
  }

  async refresh(token: string, req?: Request) {
    const session = await this.refreshTokens.getActiveSession(token, AuthSessionAudience.PORTAL);
    if (session.user.principalType !== UserPrincipalType.CUSTOMER || !session.tenantContext || !('portal' in session.tenantContext)) {
      throw new UnauthorizedException('Invalid portal refresh token');
    }
    const membership = await this.access.resolve(session.user.id, session.tenantContext.customerMembershipId);
    const context = this.context(membership);
    const rotated = await this.refreshTokens.rotateRefreshToken(token, req, context, AuthSessionAudience.PORTAL);
    return { ...(await this.accessResponse(session.user, membership)), ...rotated };
  }

  async switchCompany(principal: PortalPrincipal, companyId: string, token: string, req?: Request) {
    const session = await this.refreshTokens.getActiveSession(token, AuthSessionAudience.PORTAL);
    if (session.user.id !== principal.userId) throw new UnauthorizedException();
    const membership = await this.prisma.customerCompanyMembership.findFirst({
      where: { userId: principal.userId, companyId, status: CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } },
      include: { company: true },
    });
    if (!membership) throw new ForbiddenException('شرکت انتخاب‌شده در دسترس نیست');
    const rotated = await this.refreshTokens.rotateRefreshToken(token, req, this.context(membership), AuthSessionAudience.PORTAL);
    await this.audit.record({ actorId: principal.userId, organizationId: membership.organizationId, entityType: 'customer-membership', entityId: membership.id, action: 'portal.company_switched', metadata: { previousMembershipId: principal.membershipId } });
    return { ...(await this.accessResponse(session.user, membership)), ...rotated };
  }

  async companies(userId: string) {
    return (await this.activeMemberships(userId)).map(this.companyOption);
  }

  async acceptInvitation(dto: AcceptCustomerInvitationDto, req?: Request) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const invitation = await this.prisma.customerInvitation.findUnique({ where: { tokenHash }, include: { company: true } });
    if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.replacedByInvitationId || invitation.expiresAt <= new Date() || !invitation.company.portalEnabled || invitation.company.archivedAt) {
      throw new UnauthorizedException('دعوت‌نامه نامعتبر یا منقضی است');
    }
    let user = await this.prisma.user.findUnique({ where: { normalizedEmail: invitation.normalizedEmail } });
    if (user?.principalType === UserPrincipalType.INTERNAL) throw new ConflictException('این ایمیل متعلق به کاربر داخلی سامانه است');
    if (user && !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('تأیید هویت ناموفق بود');
    const passwordHash = user ? user.passwordHash : await bcrypt.hash(dto.password, 12);
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      if (!user) {
        if (!dto.fullName) throw new ConflictException('نام و نام خانوادگی برای حساب جدید الزامی است');
        user = await tx.user.create({
          data: { fullName: dto.fullName.trim(), email: invitation.normalizedEmail, normalizedEmail: invitation.normalizedEmail, passwordHash, principalType: UserPrincipalType.CUSTOMER, organizationId: invitation.organizationId },
        });
      }
      const claimed = await tx.customerInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null, replacedByInvitationId: null, expiresAt: { gt: now } },
        data: { acceptedAt: now, acceptedById: user!.id },
      });
      if (claimed.count !== 1) throw new ConflictException('دعوت‌نامه قبلاً استفاده شده است');
      const membership = await tx.customerCompanyMembership.upsert({
        where: { companyId_userId: { companyId: invitation.companyId, userId: user!.id } },
        create: { organizationId: invitation.organizationId, companyId: invitation.companyId, userId: user!.id, role: invitation.role, status: CustomerMembershipStatus.ACTIVE, invitedById: invitation.invitedById, invitedAt: invitation.createdAt, activatedAt: now },
        update: { role: invitation.role, status: CustomerMembershipStatus.ACTIVE, activatedAt: now, suspendedAt: null, revokedAt: null },
        include: { company: true },
      });
      return membership;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    await this.audit.record({ actorId: user!.id, organizationId: result.organizationId, entityType: 'customer-invitation', entityId: invitation.id, action: 'customer.invitation_accepted' });
    return this.createSession(user!, result, req);
  }

  async logout(token?: string) { if (token) await this.refreshTokens.revokeByToken(token, 'PORTAL_LOGOUT'); }
  async logoutAll(userId: string) { return { revokedCount: await this.refreshTokens.revokeAllUserSessionsByAudience(userId, AuthSessionAudience.PORTAL, 'PORTAL_LOGOUT_ALL') }; }

  publicResponse<T extends { refreshToken?: string }>(value: T) {
    const { refreshToken: _token, ...safe } = value;
    return safe;
  }

  private async createSession(user: any, membership: any, req?: Request) {
    const context = this.context(membership);
    const session = await this.refreshTokens.createSession(user.id, req, undefined, context, AuthSessionAudience.PORTAL);
    await this.prisma.customerCompanyMembership.update({ where: { id: membership.id }, data: { lastAccessAt: new Date() } });
    return { ...(await this.accessResponse(user, membership)), ...session };
  }

  private async accessResponse(user: any, membership: any) {
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, principalType: 'CUSTOMER', customerMembershipId: membership.id }, { audience: 'neshane-op-portal', expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') }),
      accessTokenExpiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      user: { id: user.id, fullName: user.fullName, email: user.email, principalType: 'CUSTOMER' as const },
      activeCompany: this.companyOption(membership),
    };
  }

  private context(membership: any) {
    return { portal: true as const, activeOrganizationId: membership.organizationId, activeCompanyId: membership.companyId, customerMembershipId: membership.id };
  }

  private activeMemberships(userId: string) {
    return this.prisma.customerCompanyMembership.findMany({ where: { userId, status: CustomerMembershipStatus.ACTIVE, company: { portalEnabled: true, archivedAt: null } }, include: { company: true }, orderBy: { company: { legalName: 'asc' } } });
  }

  private companyOption(membership: any) {
    return { membershipId: membership.id, companyId: membership.companyId, legalName: membership.company.legalName, brandName: membership.company.brandName, role: membership.role };
  }
  private normalize(email: string) { return email.trim().toLowerCase(); }
}
