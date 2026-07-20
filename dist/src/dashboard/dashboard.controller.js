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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const advanced_reports_service_1 = require("../reports/advanced-reports.service");
const advanced_report_filters_dto_1 = require("../reports/dto/advanced-report-filters.dto");
let DashboardController = class DashboardController {
    constructor(reports) {
        this.reports = reports;
    }
    getSummary(filters, user) {
        return this.reports.dashboard(filters, user);
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getSummary", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("report:view"),
    (0, common_1.Controller)("dashboard"),
    __metadata("design:paramtypes", [advanced_reports_service_1.AdvancedReportsService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map