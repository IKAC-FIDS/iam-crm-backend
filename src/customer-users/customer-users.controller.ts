import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CustomerRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { CurrentPortalPrincipal } from '../customer-access/current-portal-principal.decorator';
import { PortalJwtAuthGuard } from '../customer-access/portal-jwt-auth.guard';
import type { PortalPrincipal } from '../customer-access/portal-principal';
import { PortalRoles } from '../customer-access/portal-roles.decorator';
import { PortalRolesGuard } from '../customer-access/portal-roles.guard';
import { CustomerUsersService } from './customer-users.service';
import { InviteCustomerDto, SetCompanyPortalEnabledDto, UpdateCustomerMembershipDto } from './dto/customer-user.dto';

@Controller('companies/:companyId/portal-access')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InternalCustomerUsersController {
  constructor(private readonly service: CustomerUsersService) {}
  @Get() @Permissions('company-customer-user:view')
  overview(@Param('companyId') companyId: string, @CurrentUser() user: CurrentUserPayload) { return this.service.overview(companyId, getCurrentOrganizationId(user)); }
  @Patch() @Permissions('company-customer-user:manage')
  enabled(@Param('companyId') companyId: string, @Body() dto: SetCompanyPortalEnabledDto, @CurrentUser() user: CurrentUserPayload) { return this.service.setPortalEnabled(companyId, getCurrentOrganizationId(user), dto.enabled, user.userId); }
  @Post('invitations') @Permissions('company-customer-user:manage')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  invite(@Param('companyId') companyId: string, @Body() dto: InviteCustomerDto, @CurrentUser() user: CurrentUserPayload) { return this.service.invite(companyId, getCurrentOrganizationId(user), dto.email, dto.role, user.userId); }
  @Post('invitations/:invitationId/resend') @Permissions('company-customer-user:manage')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  resend(@Param('companyId') companyId: string, @Param('invitationId') invitationId: string, @CurrentUser() user: CurrentUserPayload) { return this.service.resend(companyId, getCurrentOrganizationId(user), invitationId, user.userId); }
  @Delete('invitations/:invitationId') @Permissions('company-customer-user:manage')
  revokeInvite(@Param('companyId') companyId: string, @Param('invitationId') invitationId: string, @CurrentUser() user: CurrentUserPayload) { return this.service.revokeInvitation(companyId, getCurrentOrganizationId(user), invitationId, user.userId); }
  @Patch('memberships/:membershipId') @Permissions('company-customer-user:manage')
  update(@Param('companyId') companyId: string, @Param('membershipId') membershipId: string, @Body() dto: UpdateCustomerMembershipDto, @CurrentUser() user: CurrentUserPayload) { return this.service.updateMembership(companyId, getCurrentOrganizationId(user), membershipId, dto, user.userId); }
}

@Controller('portal/company')
@UseGuards(PortalJwtAuthGuard, PortalRolesGuard)
export class PortalCustomerUsersController {
  constructor(private readonly service: CustomerUsersService) {}
  @Get() summary(@CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.portalCompanySummary(p.companyId, p.organizationId, p.role); }
  @Get('users') @PortalRoles(CustomerRole.CUSTOMER_ADMIN)
  users(@CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.overview(p.companyId, p.organizationId); }
  @Post('invitations') @PortalRoles(CustomerRole.CUSTOMER_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  invite(@Body() dto: InviteCustomerDto, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.invite(p.companyId, p.organizationId, dto.email, dto.role, p.userId); }
  @Post('invitations/:invitationId/resend') @PortalRoles(CustomerRole.CUSTOMER_ADMIN)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  resend(@Param('invitationId') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.resend(p.companyId, p.organizationId, id, p.userId); }
  @Delete('invitations/:invitationId') @PortalRoles(CustomerRole.CUSTOMER_ADMIN)
  revoke(@Param('invitationId') id: string, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.revokeInvitation(p.companyId, p.organizationId, id, p.userId); }
  @Patch('users/:membershipId') @PortalRoles(CustomerRole.CUSTOMER_ADMIN)
  update(@Param('membershipId') id: string, @Body() dto: UpdateCustomerMembershipDto, @CurrentPortalPrincipal() p: PortalPrincipal) { return this.service.updateMembership(p.companyId, p.organizationId, id, dto, p.userId, true); }
}
