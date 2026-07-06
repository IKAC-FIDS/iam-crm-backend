import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { AdminPermissionsService } from './admin-permissions.service';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
export class AdminPermissionsController {
  constructor(private adminPermissionsService: AdminPermissionsService) {}

  // ============================================================
  // ۱. دریافت لیست تمام دسترسی‌ها
  // ============================================================
  @Get()
  @Permissions('user:view')
  getAllPermissions() {
    return this.adminPermissionsService.getAllPermissions();
  }

  // ============================================================
  // ۲. دریافت دسترسی‌های یک نقش خاص
  // ============================================================
  @Get('roles/:role')
  @Permissions('user:view')
  getRolePermissions(@Param('role') role: UserRole) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }
    return this.adminPermissionsService.getRolePermissions(role);
  }

  // ============================================================
  // ۳. اختصاص یک دسترسی به نقش
  // ============================================================
  @Post('assign')
  @Permissions('user:create')
  assignPermissionToRole(
    @Body() body: { role: UserRole; action: string },
  ) {
    if (!Object.values(UserRole).includes(body.role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }
    return this.adminPermissionsService.assignPermissionToRole(
      body.role,
      body.action,
    );
  }

  // ============================================================
  // ۴. حذف یک دسترسی از نقش
  // ============================================================
  @Delete('revoke')
  @Permissions('user:deactivate')
  revokePermissionFromRole(
    @Body() body: { role: UserRole; action: string },
  ) {
    if (!Object.values(UserRole).includes(body.role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }
    return this.adminPermissionsService.revokePermissionFromRole(
      body.role,
      body.action,
    );
  }

  // ============================================================
  // ۵. ایجاد دسترسی جدید
  // ============================================================
  @Post('create')
  @Permissions('user:create')
  createPermission(
    @Body() body: { action: string; description?: string },
  ) {
    if (!body.action || body.action.trim() === '') {
      throw new BadRequestException('نام دسترسی الزامی است');
    }
    return this.adminPermissionsService.createPermission(
      body.action,
      body.description,
    );
  }

  // ============================================================
  // ۶. حذف دسترسی
  // ============================================================
  @Delete(':action')
  @Permissions('user:deactivate')
  deletePermission(@Param('action') action: string) {
    return this.adminPermissionsService.deletePermission(action);
  }

  // ============================================================
  // ✅ ۷. Bulk Assign Permissions به یک نقش
  // ============================================================
  @Post('bulk-assign')
  @Permissions('user:create')
  async bulkAssignPermissions(
    @Body() body: { role: UserRole; actions: string[] },
  ) {
    if (!Object.values(UserRole).includes(body.role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }
    if (!body.actions || body.actions.length === 0) {
      throw new BadRequestException('حداقل یک دسترسی باید انتخاب شود');
    }
    return this.adminPermissionsService.bulkAssignPermissionsToRole(
      body.role,
      body.actions,
    );
  }

  // ============================================================
  // ✅ ۸. Bulk Revoke Permissions از یک نقش
  // ============================================================
  @Post('bulk-revoke')
  @Permissions('user:deactivate')
  async bulkRevokePermissions(
    @Body() body: { role: UserRole; actions: string[] },
  ) {
    if (!Object.values(UserRole).includes(body.role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }
    if (!body.actions || body.actions.length === 0) {
      throw new BadRequestException('حداقل یک دسترسی باید انتخاب شود');
    }
    return this.adminPermissionsService.bulkRevokePermissionsFromRole(
      body.role,
      body.actions,
    );
  }

  // ============================================================
  // ✅ ۹. دریافت وضعیت کامل دسترسی‌های یک نقش
  // ============================================================
  @Get('roles/:role/with-details')
  @Permissions('user:view')
  async getRolePermissionsWithDetails(@Param('role') role: UserRole) {
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestException('نقش نامعتبر است');
    }
    return this.adminPermissionsService.getRolePermissionsWithDetails(role);
  }
}