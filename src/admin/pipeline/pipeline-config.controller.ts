import { Body, Controller, Delete, Get, Param, ParseEnumPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PipelineStage, UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { UpdateStageConfigDto } from './dto/update-stage-config.dto';
import { UpdateTransitionDto } from './dto/update-transition.dto';
import { PipelineConfigService } from './pipeline-config.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/pipeline')
export class PipelineConfigController {
  constructor(private service: PipelineConfigService) {}

  @Get('stages')
  @Permissions('pipeline:config:view')
  getStages() { return this.service.getStages(); }

  @Patch('stages/:stage')
  @Roles(UserRole.ADMIN)
  @Permissions('pipeline:config:manage')
  updateStage(@Param('stage', new ParseEnumPipe(PipelineStage)) stage: PipelineStage, @Body() dto: UpdateStageConfigDto) {
    return this.service.updateStage(stage, dto);
  }

  @Get('transitions')
  @Permissions('pipeline:transition:view')
  getTransitions() { return this.service.getTransitions(); }

  @Post('transitions')
  @Roles(UserRole.ADMIN)
  @Permissions('pipeline:transition:manage')
  createTransition(@Body() dto: CreateTransitionDto) { return this.service.createTransition(dto); }

  @Patch('transitions/:id')
  @Roles(UserRole.ADMIN)
  @Permissions('pipeline:transition:manage')
  updateTransition(@Param('id') id: string, @Body() dto: UpdateTransitionDto) { return this.service.updateTransition(id, dto); }

  @Delete('transitions/:id')
  @Roles(UserRole.ADMIN)
  @Permissions('pipeline:transition:manage')
  deleteTransition(@Param('id') id: string) { return this.service.deleteTransition(id); }
}
