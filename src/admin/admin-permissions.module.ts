import { Module } from '@nestjs/common';
import { AdminPermissionsService } from './admin-permissions.service';
import { AdminPermissionsController } from './admin-permissions.controller';

@Module({
  providers: [AdminPermissionsService],
  controllers: [AdminPermissionsController],
  exports: [AdminPermissionsService],
})
export class AdminPermissionsModule {}