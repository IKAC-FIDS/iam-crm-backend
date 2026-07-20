import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { ReportFiltersDto } from "./dto/report-filters.dto";
import { AdvancedReportFiltersDto } from "./dto/advanced-report-filters.dto";
import { AdvancedReportsService } from "./advanced-reports.service";
import { ReportsService } from "./reports.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("report:view")
@Controller("reports")
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private advancedReportsService: AdvancedReportsService,
  ) {}

  @Get("opportunities/forecast")
  getOpportunityForecast(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.advancedReportsService.forecast(filters, user);
  }

  @Get("opportunities/aging")
  getOpportunityAging(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.advancedReportsService.aging(filters, user);
  }

  @Get("meetings/performance")
  getMeetingPerformance(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.advancedReportsService.meetingPerformance(filters, user);
  }

  @Get("tasks/performance")
  getTaskPerformance(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.advancedReportsService.taskPerformance(filters, user);
  }

  @Get("conversion-rates")
  getConversionRates(
    @Query() filters: ReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getConversionRates(filters, user);
  }

  @Get("stage-durations")
  getAverageStageDuration(
    @Query() filters: ReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getAverageStageDuration(filters, user);
  }

  @Get("pipeline-summary")
  getPipelineSummary(
    @Query() filters: ReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getPipelineSummary(filters, user);
  }

  @Get("activities/by-user")
  getActivitiesByUser(
    @Query() filters: ReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getActivitiesByUser(filters, user);
  }

  @Get("activities")
  getActivityReport(
    @Query() filters: ReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getActivityReport(filters, user);
  }

  @Get("pipeline/by-owner")
  getPipelineByOwner(
    @Query() filters: ReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reportsService.getPipelineByOwner(filters, user);
  }

  @Get("filter-options")
  getFilterOptions(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getFilterOptions(user);
  }
}
