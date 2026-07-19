import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { FindOwnerOptionsDto } from './dto/find-owner-options.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ============================================================
  // ۱. ایجاد کاربر جدید
  // ============================================================
  @Post()
  @Permissions('user:create')
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.create(dto, actor);
  }

  // ============================================================
  // ۲. دریافت لیست کاربران
  // ============================================================
  @Get()
  @Permissions('user:view')
  findAll(@Query() query: FindUsersDto, @CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.findAll(query, actor);
  }

  @Get('owner-options')
  @Permissions('company:assign-owner')
  getOwnerOptions(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.getOwnerOptions(user);
  }

  @Get('owner-options/v2')
  @Permissions('company:assign-owner')
  findOwnerOptions(
    @Query() query: FindOwnerOptionsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.usersService.findOwnerOptions(user, query);
  }

  // ============================================================
  // ۳. دریافت یک کاربر
  // ============================================================
  @Get(':id')
  @Permissions('user:view')
  findOne(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.findOne(id, actor);
  }

  // ============================================================
  // ۴. غیرفعال کردن کاربر
  // ============================================================
  @Patch(':id/deactivate')
  @Permissions('user:deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.deactivate(id, actor);
  }

  // ============================================================
  // ✅ ۵. فعال‌سازی مجدد کاربر
  // ============================================================
  @Patch(':id/activate')
  @Permissions('user:activate')
  activate(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.usersService.activate(id, actor);
  }

  // ============================================================
  // ✅ ۶. تغییر نقش یک کاربر
  // ============================================================
  @Patch(':id/role')
  @Permissions('user:change-role')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.usersService.updateUserRole(id, dto, actor);
  }
}
