import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { AdvancedReportsService } from "../reports/advanced-reports.service";
import { AdvancedReportFiltersDto } from "../reports/dto/advanced-report-filters.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("report:view")
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly reports: AdvancedReportsService) {}

  @Get("summary")
  getSummary(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reports.dashboard(filters, user);
  }
}
