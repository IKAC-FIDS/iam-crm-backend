import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateSsoProviderDto } from './dto/create-sso-provider.dto';
import { UpdateSsoProviderDto } from './dto/update-sso-provider.dto';
import { SsoProviderService } from './sso-provider.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/sso-providers')
export class SsoAdminController {
  constructor(private readonly service: SsoProviderService) {}

  @Get()
  @Permissions('sso-provider:view')
  listProviders() {
    return this.service.listProviders();
  }

  @Get(':id')
  @Permissions('sso-provider:view')
  getProvider(@Param('id') id: string) {
    return this.service.getProvider(id);
  }

  @Post()
  @Permissions('sso-provider:manage')
  createProvider(
    @Body() dto: CreateSsoProviderDto,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.service.createProvider(dto, actor.userId);
  }

  @Patch(':id')
  @Permissions('sso-provider:manage')
  updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateSsoProviderDto,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.service.updateProvider(id, dto, actor.userId);
  }

  @Patch(':id/disable')
  @Permissions('sso-provider:manage')
  disableProvider(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.service.disableProvider(id, actor.userId);
  }

  @Delete(':id')
  @Permissions('sso-provider:manage')
  deleteProvider(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.service.deleteProvider(id, actor.userId);
  }
}