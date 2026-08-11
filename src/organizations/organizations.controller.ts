import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
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

}
