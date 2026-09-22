"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimesheetReportingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const timesheet_report_dto_1 = require("./dto/timesheet-report.dto");
const timesheet_reporting_service_1 = require("./timesheet-reporting.service");
let TimesheetReportingController = class TimesheetReportingController {
    constructor(reports) {
        this.reports = reports;
    }
    report(query, user) { return this.reports.report(query, user); }
    personal(query, user) { return this.reports.personal(query, user); }
    async export(query, user, response) {
        const file = await this.reports.export(query, user);
        if (!('buffer' in file))
            throw new Error('Invalid export result');
        response.setHeader('Content-Type', file.contentType);
        response.setHeader('Content-Disposition', file.contentDisposition);
        response.setHeader('Cache-Control', 'no-store');
        return new common_1.StreamableFile(file.buffer);
    }
};
exports.TimesheetReportingController = TimesheetReportingController;
__decorate([
    (0, common_1.Get)('admin/timesheets/reports'),
    (0, permissions_decorator_1.Permissions)('timesheet:report'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_report_dto_1.TimesheetReportDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetReportingController.prototype, "report", null);
__decorate([
    (0, common_1.Get)('timesheets/me/summary'),
    (0, permissions_decorator_1.Permissions)('timesheet:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_report_dto_1.PersonalTimesheetReportDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetReportingController.prototype, "personal", null);
__decorate([
    (0, common_1.Get)('admin/timesheets/export'),
    (0, permissions_decorator_1.Permissions)('timesheet:export'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_report_dto_1.TimesheetReportDto, Object, Object]),
    __metadata("design:returntype", Promise)
], TimesheetReportingController.prototype, "export", null);
exports.TimesheetReportingController = TimesheetReportingController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [timesheet_reporting_service_1.TimesheetReportingService])
], TimesheetReportingController);
//# sourceMappingURL=timesheet-reporting.controller.js.map