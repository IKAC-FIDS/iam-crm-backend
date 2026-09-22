"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetsModule = void 0;
const common_1 = require("@nestjs/common");
const company_access_module_1 = require("../companies/company-access.module");
const notification_core_module_1 = require("../notification-core/notification-core.module");
const tasks_module_1 = require("../tasks/tasks.module");
const leave_request_service_1 = require("./leave-request.service");
const timesheet_approval_service_1 = require("./timesheet-approval.service");
const timesheet_conflict_service_1 = require("./timesheet-conflict.service");
const timesheet_time_calculation_service_1 = require("./timesheet-time-calculation.service");
const timesheets_controller_1 = require("./timesheets.controller");
const timesheet_service_1 = require("./timesheet.service");
const work_schedule_resolver_service_1 = require("./work-schedule-resolver.service");
let TimesheetsModule = class TimesheetsModule {
};
exports.TimesheetsModule = TimesheetsModule;
exports.TimesheetsModule = TimesheetsModule = __decorate([
    (0, common_1.Module)({
        imports: [tasks_module_1.TasksModule, company_access_module_1.CompanyAccessModule, notification_core_module_1.NotificationCoreModule],
        controllers: [
            timesheets_controller_1.TimesheetsController,
            timesheets_controller_1.LeaveRequestsController,
            timesheets_controller_1.TimesheetAdminController,
        ],
        providers: [
            work_schedule_resolver_service_1.WorkScheduleResolverService,
            timesheet_time_calculation_service_1.TimesheetTimeCalculationService,
            timesheet_conflict_service_1.TimesheetConflictService,
            timesheet_service_1.TimesheetService,
            leave_request_service_1.LeaveRequestService,
            timesheet_approval_service_1.TimesheetApprovalService,
        ],
        exports: [
            work_schedule_resolver_service_1.WorkScheduleResolverService,
            timesheet_time_calculation_service_1.TimesheetTimeCalculationService,
            timesheet_conflict_service_1.TimesheetConflictService,
        ],
    })
], TimesheetsModule);
//# sourceMappingURL=timesheets.module.js.map