import { Module } from "@nestjs/common";
import { WorkScheduleManagementController, WorkScheduleManagementService } from './work-schedule-management';
import { ReportExportService } from '../common/export/report-export.service';
import { TimesheetReportingService } from './timesheet-reporting.service';
import { TimesheetReportingController } from './timesheet-reporting.controller';
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
    WorkScheduleManagementController,
    TimesheetReportingController,
    TimesheetsController,
    LeaveRequestsController,
    TimesheetAdminController,
  ],
  providers: [
    WorkScheduleManagementService,
    ReportExportService,
    TimesheetReportingService,
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
    TimesheetService,
    LeaveRequestService,
  ],
})
export class TimesheetsModule {}
