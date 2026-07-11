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
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsDto } from './dto/find-organizations.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get('organizations/current')
  @Permissions('organization:view')
  current(@CurrentUser() user: CurrentUserPayload) {
    return this.service.current(user);
  }

  @Get('admin/organizations')
  @Permissions('organization:manage')
  findAll(
    @Query() query: FindOrganizationsDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.findAll(query, user);
  }

  @Post('admin/organizations')
  @Permissions('organization:manage')
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(dto, user);
  }

  @Get('admin/organizations/:id')
  @Permissions('organization:manage')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findOne(id, user);
  }

  @Patch('admin/organizations/:id')
  @Permissions('organization:manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch('admin/organizations/:id/activate')
  @Permissions('organization:manage')
  activate(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.activate(id, user);
  }

  @Patch('admin/organizations/:id/suspend')
  @Permissions('organization:manage')
  suspend(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.suspend(id, user);
  }
}