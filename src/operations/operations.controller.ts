import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import { AnyPermission, Permissions } from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { OperationsCompaniesQueryDto } from "./dto/operations-companies-query.dto";
import { OperationsWorkspaceQueryDto } from "./dto/operations-workspace-query.dto";
import { OperationsService } from "./operations.service";

@Controller("operations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  @Get("workspace")
  @AnyPermission("task:view", "meeting:view", "opportunity:view", "company:view")
  getWorkspace(
    @Query() query: OperationsWorkspaceQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.getWorkspace(query, user);
  }

  @Get("companies")
  @Permissions("company:view")
  getCompanies(
    @Query() query: OperationsCompaniesQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.getCompanies(query, user);
  }

  @Get("companies/:companyId/opportunities")
  @Permissions("company:view", "opportunity:view")
  getCompanyOpportunities(
    @Param("companyId") companyId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.getCompanyActiveOpportunities(companyId, user);
  }
}
