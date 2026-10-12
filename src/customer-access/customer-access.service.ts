import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CustomerMembershipStatus, UserPrincipalType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string, membershipId: string) {
    const membership = await this.prisma.customerCompanyMembership.findFirst({
      where: {
        id: membershipId,
        userId,
        status: CustomerMembershipStatus.ACTIVE,
        user: { isActive: true, principalType: UserPrincipalType.CUSTOMER },
        company: { portalEnabled: true, archivedAt: null },
        organization: { status: 'ACTIVE' },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        company: { select: { id: true, organizationId: true, legalName: true, brandName: true, portalEnabled: true } },
      },
    });
    if (!membership || membership.company.organizationId !== membership.organizationId) {
      throw new UnauthorizedException('Portal membership is not active');
    }
    return membership;
  }

  async assertCompany(companyId: string, organizationId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, organizationId, archivedAt: null },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }
}
