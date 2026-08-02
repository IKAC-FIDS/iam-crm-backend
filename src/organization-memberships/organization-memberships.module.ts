import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationMembershipsService } from './organization-memberships.service';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationMembershipsService],
  exports: [OrganizationMembershipsService],
})
export class OrganizationMembershipsModule {}
