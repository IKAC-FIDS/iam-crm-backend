import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FindActivitiesDto } from './dto/find-activities.dto';
import { PaginationDto } from '../common/dto/pagination.dto'; // ← اضافه شد

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @Permissions('activity:view')
  findByCompany(
    @Query() query: FindActivitiesDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.activitiesService.findByCompany(query.companyId, query, user);
  }

  @Get('follow-ups/due')
  @Permissions('activity:view')
  findDueFollowUps(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationDto, // ← دیگر خطا ندارد
  ) {
    return this.activitiesService.findDueFollowUps(user, pagination);
  }

  @Post()
  @Permissions('activity:create')
  create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.activitiesService.create(dto, user);
  }
}