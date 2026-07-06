import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ============================================================
  // ۱. ایجاد کاربر جدید
  // ============================================================
  @Post()
  @Permissions('user:create')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ============================================================
  // ۲. دریافت لیست کاربران
  // ============================================================
  @Get()
  @Permissions('user:view')
  findAll() {
    return this.usersService.findAll();
  }

  // ============================================================
  // ۳. دریافت یک کاربر
  // ============================================================
  @Get(':id')
  @Permissions('user:view')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ============================================================
  // ۴. غیرفعال کردن کاربر
  // ============================================================
  @Patch(':id/deactivate')
  @Permissions('user:deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  // ============================================================
  // ✅ ۵. فعال‌سازی مجدد کاربر
  // ============================================================
  @Patch(':id/activate')
  @Permissions('user:activate') // یا می‌توانید از 'user:deactivate' استفاده کنید
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  // ============================================================
  // ✅ ۶. تغییر نقش یک کاربر
  // ============================================================
  @Patch(':id/role')
  @Permissions('user:create')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, dto);
  }
}