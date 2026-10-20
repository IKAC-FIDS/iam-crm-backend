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
exports.TimesheetAdminController = exports.LeaveRequestsController = exports.TimesheetsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const timesheet_dto_1 = require("./dto/timesheet.dto");
const leave_request_service_1 = require("./leave-request.service");
const timesheet_approval_service_1 = require("./timesheet-approval.service");
const timesheet_service_1 = require("./timesheet.service");
let TimesheetsController = class TimesheetsController {
    constructor(service) {
        this.service = service;
    }
    mine(q, u) {
        return this.service.findMine(q, u);
    }
    one(id, u) {
        return this.service.findOne(id, u);
    }
    create(dto, u) {
        return this.service.create(dto, u);
    }
    update(id, dto, u) {
        return this.service.update(id, dto, u);
    }
    submit(id, u) {
        return this.service.submit(id, u);
    }
    cancel(id, u) {
        return this.service.cancel(id, u);
    }
};
exports.TimesheetsController = TimesheetsController;
__decorate([
    (0, common_1.Get)("me"),
    (0, permissions_decorator_1.Permissions)("timesheet:view"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_dto_1.FindMyTimesheetsDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.Permissions)("timesheet:view"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "one", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)("timesheet:manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_dto_1.CreateTimesheetDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.Permissions)("timesheet:manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, timesheet_dto_1.UpdateTimesheetDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/submit"),
    (0, permissions_decorator_1.Permissions)("timesheet:manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(":id/cancel"),
    (0, permissions_decorator_1.Permissions)("timesheet:manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimesheetsController.prototype, "cancel", null);
exports.TimesheetsController = TimesheetsController = __decorate([
    (0, common_1.Controller)("timesheets"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [timesheet_service_1.TimesheetService])
], TimesheetsController);
let LeaveRequestsController = class LeaveRequestsController {
    constructor(service) {
        this.service = service;
    }
    mine(q, u) {
        return this.service.findMine(q, u);
    }
    one(id, u) {
        return this.service.findOne(id, u);
    }
    create(dto, u) {
        return this.service.create(dto, u);
    }
    update(id, dto, u) {
        return this.service.update(id, dto, u);
    }
    submit(id, u) {
        return this.service.submit(id, u);
    }
    cancel(id, u) {
        return this.service.cancel(id, u);
    }
};
exports.LeaveRequestsController = LeaveRequestsController;
__decorate([
    (0, common_1.Get)("me"),
    (0, permissions_decorator_1.Permissions)("leave:view"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_dto_1.FindMyLeaveRequestsDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveRequestsController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, permissions_decorator_1.Permissions)("leave:view"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveRequestsController.prototype, "one", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)("leave:manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_dto_1.CreateLeaveRequestDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, permissions_decorator_1.Permissions)("leave:manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, timesheet_dto_1.UpdateLeaveRequestDto, Object]),
    __metadata("design:returntype", void 0)
], LeaveRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/submit"),
    (0, permissions_decorator_1.Permissions)("leave:manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveRequestsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(":id/cancel"),
    (0, permissions_decorator_1.Permissions)("leave:manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeaveRequestsController.prototype, "cancel", null);
exports.LeaveRequestsController = LeaveRequestsController = __decorate([
    (0, common_1.Controller)("leave-requests"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [leave_request_service_1.LeaveRequestService])
], LeaveRequestsController);
let TimesheetAdminController = class TimesheetAdminController {
    constructor(service) {
        this.service = service;
    }
    timesheets(q, u) {
        return this.service.listTimesheets(q, u);
    }
    approveTimesheet(id, u) {
        return this.service.approveTimesheet(id, u);
    }
    rejectTimesheet(id, dto, u) {
        return this.service.rejectTimesheet(id, dto.reason, u);
    }
    leave(q, u) {
        return this.service.listLeave(q, u);
    }
    approveLeave(id, u) {
        return this.service.approveLeave(id, u);
    }
    rejectLeave(id, dto, u) {
        return this.service.rejectLeave(id, dto.reason, u);
    }
};
exports.TimesheetAdminController = TimesheetAdminController;
__decorate([
    (0, common_1.Get)("timesheets"),
    (0, permissions_decorator_1.AnyPermission)("timesheet:approve", "timesheet:approve-organization", "timesheet:view-organization"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_dto_1.FindAdminTimesheetsDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetAdminController.prototype, "timesheets", null);
__decorate([
    (0, common_1.Post)("timesheets/:id/approve"),
    (0, permissions_decorator_1.AnyPermission)("timesheet:approve", "timesheet:approve-organization"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimesheetAdminController.prototype, "approveTimesheet", null);
__decorate([
    (0, common_1.Post)("timesheets/:id/reject"),
    (0, permissions_decorator_1.AnyPermission)("timesheet:approve", "timesheet:approve-organization"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, timesheet_dto_1.RejectDecisionDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetAdminController.prototype, "rejectTimesheet", null);
__decorate([
    (0, common_1.Get)("leave-requests"),
    (0, permissions_decorator_1.AnyPermission)("leave:approve", "leave:approve-organization", "leave:view-organization"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [timesheet_dto_1.FindAdminLeaveRequestsDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetAdminController.prototype, "leave", null);
__decorate([
    (0, common_1.Post)("leave-requests/:id/approve"),
    (0, permissions_decorator_1.AnyPermission)("leave:approve", "leave:approve-organization"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimesheetAdminController.prototype, "approveLeave", null);
__decorate([
    (0, common_1.Post)("leave-requests/:id/reject"),
    (0, permissions_decorator_1.AnyPermission)("leave:approve", "leave:approve-organization"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, timesheet_dto_1.RejectDecisionDto, Object]),
    __metadata("design:returntype", void 0)
], TimesheetAdminController.prototype, "rejectLeave", null);
exports.TimesheetAdminController = TimesheetAdminController = __decorate([
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [timesheet_approval_service_1.TimesheetApprovalService])
], TimesheetAdminController);
//# sourceMappingURL=timesheets.controller.js.map