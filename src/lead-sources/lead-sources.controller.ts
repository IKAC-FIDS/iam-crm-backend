import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveFilterDto } from '../common/dto/active-filter.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLeadSourceDto } from './dto/create-lead-source.dto';
import { UpdateLeadSourceDto } from './dto/update-lead-source.dto';
import { LeadSourcesService } from './lead-sources.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('lead-sources')
export class LeadSourcesController {
  constructor(private service: LeadSourcesService) {}

  @Get()
  @Permissions('library:lead-source:view')
  findAll(@Query() query: ActiveFilterDto) { return this.service.findAll(query.active ?? true); }

  @Post()
  @Roles(UserRole.ADMIN)
  @Permissions('library:lead-source:manage')
  create(@Body() dto: CreateLeadSourceDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('library:lead-source:manage')
  update(@Param('id') id: string, @Body() dto: UpdateLeadSourceDto) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Permissions('library:lead-source:manage')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
