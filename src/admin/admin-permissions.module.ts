import { Module } from '@nestjs/common';
import { AdminPermissionsService } from './admin-permissions.service';
import { AdminPermissionsController } from './admin-permissions.controller';
import { PermissionsManagementController, RolesManagementController } from './rbac-management.controller';
import { RbacManagementService } from './rbac-management.service';

@Module({
  providers: [AdminPermissionsService, RbacManagementService],
  controllers: [AdminPermissionsController, PermissionsManagementController, RolesManagementController],
  exports: [AdminPermissionsService],
})
export class AdminPermissionsModule {}
