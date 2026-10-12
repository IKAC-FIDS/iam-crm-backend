import { CustomerRole } from '@prisma/client';

export interface PortalPrincipal {
  userId: string;
  email: string;
  principalType: 'CUSTOMER';
  organizationId: string;
  companyId: string;
  membershipId: string;
  role: CustomerRole;
}
