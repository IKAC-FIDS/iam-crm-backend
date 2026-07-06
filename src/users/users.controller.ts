import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ============================================================
  // ۱. ایجاد کاربر جدید
  // ============================================================
  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions('user:create')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ============================================================
  // ۲. دریافت لیست کاربران
  // ============================================================
  @Get()
  @Roles(UserRole.ADMIN)
  @Permissions('user:view')
  findAll(@Query() query: FindUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('owner-options')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('company:assign-owner')
  getOwnerOptions(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getOwnerOptions(user);
  }

  // ============================================================
  // ۳. دریافت یک کاربر
  // ============================================================
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('user:view')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ============================================================
  // ۴. غیرفعال کردن کاربر
  // ============================================================
  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @Permissions('user:deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  // ============================================================
  // ✅ ۵. فعال‌سازی مجدد کاربر
  // ============================================================
  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @Permissions('user:activate') // یا می‌توانید از 'user:deactivate' استفاده کنید
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  // ============================================================
  // ✅ ۶. تغییر نقش یک کاربر
  // ============================================================
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @Permissions('user:create')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, dto);
  }
}
