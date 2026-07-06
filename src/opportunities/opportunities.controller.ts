import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ArchiveOpportunityDto } from './dto/archive-opportunity.dto';
import { ChangeOpportunityOwnerDto } from './dto/change-opportunity-owner.dto';
import { ChangeOpportunityStageDto } from './dto/change-opportunity-stage.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { FindOpportunitiesDto } from './dto/find-opportunities.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { OpportunitiesService } from './opportunities.service';

@Controller('opportunities')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class OpportunitiesController {
  constructor(private service: OpportunitiesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP, UserRole.BOARDS)
  @Permissions('opportunity:view')
  findAll(@Query() query: FindOpportunitiesDto, @CurrentUser() user: CurrentUserPayload) { return this.service.findAll(query, user); }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP)
  @Permissions('opportunity:create')
  create(@Body() dto: CreateOpportunityDto, @CurrentUser() user: CurrentUserPayload) { return this.service.create(dto, user); }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP, UserRole.BOARDS)
  @Permissions('opportunity:view')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) { return this.service.findOne(id, user); }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP)
  @Permissions('opportunity:update')
  update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto, @CurrentUser() user: CurrentUserPayload) { return this.service.update(id, dto, user); }

  @Patch(':id/stage')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP)
  @Permissions('opportunity:change-stage')
  changeStage(@Param('id') id: string, @Body() dto: ChangeOpportunityStageDto, @CurrentUser() user: CurrentUserPayload) { return this.service.changeStage(id, dto, user); }

  @Patch(':id/owner')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('opportunity:change-owner')
  changeOwner(@Param('id') id: string, @Body() dto: ChangeOpportunityOwnerDto, @CurrentUser() user: CurrentUserPayload) { return this.service.changeOwner(id, dto, user); }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('opportunity:archive')
  archive(@Param('id') id: string, @Body() dto: ArchiveOpportunityDto, @CurrentUser() user: CurrentUserPayload) { return this.service.archive(id, dto, user); }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('opportunity:restore')
  restore(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) { return this.service.restore(id, user); }
}
