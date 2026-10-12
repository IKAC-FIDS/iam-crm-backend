import { SetMetadata } from '@nestjs/common';
import { CustomerRole } from '@prisma/client';

export const PORTAL_ROLES_KEY = 'portal-roles';
export const PortalRoles = (...roles: CustomerRole[]) =>
  SetMetadata(PORTAL_ROLES_KEY, roles);
