import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationMembershipsService } from './organization-memberships.service';
import { TenantResolverService } from './tenant-resolver.service';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationMembershipsService, TenantResolverService],
  exports: [OrganizationMembershipsService, TenantResolverService],
})
export class OrganizationMembershipsModule {}
