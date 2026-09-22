import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import {
  AnyPermission,
  Permissions,
} from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import {
  CreateLeaveRequestDto,
  CreateTimesheetDto,
  FindAdminLeaveRequestsDto,
  FindAdminTimesheetsDto,
  FindMyLeaveRequestsDto,
  FindMyTimesheetsDto,
  RejectDecisionDto,
  UpdateLeaveRequestDto,
  UpdateTimesheetDto,
} from "./dto/timesheet.dto";
import { LeaveRequestService } from "./leave-request.service";
import { TimesheetApprovalService } from "./timesheet-approval.service";
import { TimesheetService } from "./timesheet.service";

@Controller("timesheets")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimesheetsController {
  constructor(private readonly service: TimesheetService) {}
  @Get("me") @Permissions("timesheet:view") mine(
    @Query() q: FindMyTimesheetsDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findMine(q, u);
  }
  @Get(":id") @Permissions("timesheet:view") one(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findOne(id, u);
  }
  @Post() @Permissions("timesheet:manage") create(
    @Body() dto: CreateTimesheetDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.create(dto, u);
  }
  @Patch(":id") @Permissions("timesheet:manage") update(
    @Param("id") id: string,
    @Body() dto: UpdateTimesheetDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, u);
  }
  @Post(":id/submit") @Permissions("timesheet:manage") submit(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.submit(id, u);
  }
  @Post(":id/cancel") @Permissions("timesheet:manage") cancel(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.cancel(id, u);
  }
}

@Controller("leave-requests")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveRequestsController {
  constructor(private readonly service: LeaveRequestService) {}
  @Get("me") @Permissions("leave:view") mine(
    @Query() q: FindMyLeaveRequestsDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findMine(q, u);
  }
  @Get(":id") @Permissions("leave:view") one(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.findOne(id, u);
  }
  @Post() @Permissions("leave:manage") create(
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.create(dto, u);
  }
  @Patch(":id") @Permissions("leave:manage") update(
    @Param("id") id: string,
    @Body() dto: UpdateLeaveRequestDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.update(id, dto, u);
  }
  @Post(":id/submit") @Permissions("leave:manage") submit(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.submit(id, u);
  }
  @Post(":id/cancel") @Permissions("leave:manage") cancel(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.cancel(id, u);
  }
}

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimesheetAdminController {
  constructor(private readonly service: TimesheetApprovalService) {}
  @Get("timesheets")
  @AnyPermission(
    "timesheet:approve",
    "timesheet:approve-organization",
    "timesheet:view-organization",
  )
  timesheets(
    @Query() q: FindAdminTimesheetsDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.listTimesheets(q, u);
  }
  @Post("timesheets/:id/approve")
  @AnyPermission("timesheet:approve", "timesheet:approve-organization")
  approveTimesheet(
    @Param("id") id: string,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.approveTimesheet(id, u);
  }
  @Post("timesheets/:id/reject")
  @AnyPermission("timesheet:approve", "timesheet:approve-organization")
  rejectTimesheet(
    @Param("id") id: string,
    @Body() dto: RejectDecisionDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.rejectTimesheet(id, dto.reason, u);
  }
  @Get("leave-requests")
  @AnyPermission(
    "leave:approve",
    "leave:approve-organization",
    "leave:view-organization",
  )
  leave(
    @Query() q: FindAdminLeaveRequestsDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.listLeave(q, u);
  }
  @Post("leave-requests/:id/approve")
  @AnyPermission("leave:approve", "leave:approve-organization")
  approveLeave(@Param("id") id: string, @CurrentUser() u: CurrentUserPayload) {
    return this.service.approveLeave(id, u);
  }
  @Post("leave-requests/:id/reject")
  @AnyPermission("leave:approve", "leave:approve-organization")
  rejectLeave(
    @Param("id") id: string,
    @Body() dto: RejectDecisionDto,
    @CurrentUser() u: CurrentUserPayload,
  ) {
    return this.service.rejectLeave(id, dto.reason, u);
  }
}
