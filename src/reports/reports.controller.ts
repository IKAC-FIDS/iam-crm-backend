import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP, UserRole.BOARDS)
@Permissions('report:view')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('conversion-rates')
  getConversionRates(@Query() filters: ReportFiltersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getConversionRates(filters, user);
  }

  @Get('stage-durations')
  getAverageStageDuration(@Query() filters: ReportFiltersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getAverageStageDuration(filters, user);
  }

  @Get('pipeline-summary')
  getPipelineSummary(@Query() filters: ReportFiltersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getPipelineSummary(filters, user);
  }

  @Get('activities/by-user')
  getActivitiesByUser(@Query() filters: ReportFiltersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getActivitiesByUser(filters, user);
  }

  @Get('activities')
  getActivityReport(@Query() filters: ReportFiltersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getActivityReport(filters, user);
  }

  @Get('pipeline/by-owner')
  getPipelineByOwner(@Query() filters: ReportFiltersDto, @CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getPipelineByOwner(filters, user);
  }

  @Get('filter-options')
  getFilterOptions(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getFilterOptions(user);
  }
}
