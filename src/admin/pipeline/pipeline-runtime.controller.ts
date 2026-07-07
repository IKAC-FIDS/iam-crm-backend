import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PipelineConfigService } from './pipeline-config.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP, UserRole.BOARDS)
@Controller('pipeline')
export class PipelineRuntimeController {
  constructor(private service: PipelineConfigService) {}

  @Get('stages')
  @Permissions('opportunity:view')
  getActiveStages() {
    return this.service.getStages(true);
  }

  @Get('transitions')
  @Permissions('opportunity:view')
  getTransitions() {
    return this.service.getTransitions();
  }
}
