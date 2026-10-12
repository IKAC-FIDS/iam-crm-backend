import { Module } from '@nestjs/common';
import { CustomerAccessService } from './customer-access.service';
import { PortalJwtStrategy } from './portal-jwt.strategy';
import { PortalRolesGuard } from './portal-roles.guard';

@Module({
  providers: [CustomerAccessService, PortalJwtStrategy, PortalRolesGuard],
  exports: [CustomerAccessService, PortalRolesGuard],
})
export class CustomerAccessModule {}
