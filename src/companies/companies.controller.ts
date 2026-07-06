import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ChangeStageDto } from './dto/change-stage.dto';
import { ChangeOwnerDto, BulkChangeOwnerDto } from './dto/change-owner.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FindCompaniesDto } from './dto/find-companies.dto';
import { ArchiveCompanyDto } from './dto/archive-company.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

 @Get()
 findAll(
   @CurrentUser() user: CurrentUserPayload,
   @Query() query: FindCompaniesDto,
 ) {
   return this.companiesService.findAll(user, query, {
     stage: query.stage,
     priority: query.priority,
     withoutOwner: query.withoutOwner === 'true',
     search: query.search,
     ownerId: query.ownerId,
     includeArchived: query.includeArchived === 'true',
     archivedOnly: query.archivedOnly === 'true',
   });
 }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.companiesService.findOne(id, user);
  }

  @Post()
  create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.update(id, dto, user);
  }

  @Patch(':id/stage')
  changeStage(
    @Param('id') id: string,
    @Body() dto: ChangeStageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.changeStage(id, dto, user);
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('company:archive')
  archive(
    @Param('id') id: string,
    @Body() dto: ArchiveCompanyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.archive(id, dto, user);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('company:restore')
  restore(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.companiesService.restore(id, user);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('company:bulk-change-owner')
  @Patch('bulk/owner')
  bulkChangeOwner(
    @Body() dto: BulkChangeOwnerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.bulkChangeOwner(dto, user);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Permissions('company:change-owner')
  @Patch(':id/owner')
  changeOwner(
    @Param('id') id: string,
    @Body() dto: ChangeOwnerDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companiesService.changeOwner(id, dto, user);
  }
}
