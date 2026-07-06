import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveFilterDto } from '../common/dto/active-filter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLookupOptionDto } from './dto/create-lookup-option.dto';
import { UpdateLookupOptionDto } from './dto/update-lookup-option.dto';
import { LookupsService } from './lookups.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('lookups')
export class LookupsController {
  constructor(private service: LookupsService) {}

  @Get(':group')
  @Permissions('lookup:view')
  findAll(@Param('group') group: string, @Query() query: ActiveFilterDto) { return this.service.findAll(group, query.active ?? true); }

  @Post(':group')
  @Roles(UserRole.ADMIN)
  @Permissions('lookup:manage')
  create(@Param('group') group: string, @Body() dto: CreateLookupOptionDto) { return this.service.create(group, dto); }

  @Patch(':group/:id')
  @Roles(UserRole.ADMIN)
  @Permissions('lookup:manage')
  update(@Param('group') group: string, @Param('id') id: string, @Body() dto: UpdateLookupOptionDto) { return this.service.update(group, id, dto); }

  @Delete(':group/:id')
  @Roles(UserRole.ADMIN)
  @Permissions('lookup:manage')
  remove(@Param('group') group: string, @Param('id') id: string) { return this.service.remove(group, id); }
}
