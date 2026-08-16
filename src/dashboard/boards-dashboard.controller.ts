import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AdvancedReportFiltersDto } from "../reports/dto/advanced-report-filters.dto";
import { BoardsDashboardService } from "./boards-dashboard.service";

@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard)
@Permissions("report:view")
@Roles(UserRole.BOARDS)
@Controller("dashboard/boards")
export class BoardsDashboardController {
  constructor(private readonly boardsDashboard: BoardsDashboardService) {}

  @Get()
  overview(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.boardsDashboard.overview(filters, user);
  }
}
