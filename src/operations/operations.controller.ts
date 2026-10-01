import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
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
  @Permissions("task:view", "meeting:view", "opportunity:view")
  getWorkspace(
    @Query() query: OperationsWorkspaceQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.getWorkspace(query, user);
  }

  @Get("companies")
  @Permissions(
    "company:view",
    "task:view",
    "opportunity:view",
    "activity:view",
    "meeting:view",
  )
  getCompanies(
    @Query() query: OperationsCompaniesQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.getCompanies(query, user);
  }
}
