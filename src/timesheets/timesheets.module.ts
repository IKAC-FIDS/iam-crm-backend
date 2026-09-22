import { Module } from "@nestjs/common";
import { CompanyAccessModule } from "../companies/company-access.module";
import { NotificationCoreModule } from "../notification-core/notification-core.module";
import { TasksModule } from "../tasks/tasks.module";
import { LeaveRequestService } from "./leave-request.service";
import { TimesheetApprovalService } from "./timesheet-approval.service";
import { TimesheetConflictService } from "./timesheet-conflict.service";
import { TimesheetTimeCalculationService } from "./timesheet-time-calculation.service";
import {
  LeaveRequestsController,
  TimesheetAdminController,
  TimesheetsController,
} from "./timesheets.controller";
import { TimesheetService } from "./timesheet.service";
import { WorkScheduleResolverService } from "./work-schedule-resolver.service";

@Module({
  imports: [TasksModule, CompanyAccessModule, NotificationCoreModule],
  controllers: [
    TimesheetsController,
    LeaveRequestsController,
    TimesheetAdminController,
  ],
  providers: [
    WorkScheduleResolverService,
    TimesheetTimeCalculationService,
    TimesheetConflictService,
    TimesheetService,
    LeaveRequestService,
    TimesheetApprovalService,
  ],
  exports: [
    WorkScheduleResolverService,
    TimesheetTimeCalculationService,
    TimesheetConflictService,
  ],
})
export class TimesheetsModule {}
