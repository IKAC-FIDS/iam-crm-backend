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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const report_filters_dto_1 = require("./dto/report-filters.dto");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getConversionRates(filters, user) {
        return this.reportsService.getConversionRates(filters, user);
    }
    getAverageStageDuration(filters, user) {
        return this.reportsService.getAverageStageDuration(filters, user);
    }
    getPipelineSummary(filters, user) {
        return this.reportsService.getPipelineSummary(filters, user);
    }
    getActivitiesByUser(filters, user) {
        return this.reportsService.getActivitiesByUser(filters, user);
    }
    getActivityReport(filters, user) {
        return this.reportsService.getActivityReport(filters, user);
    }
    getPipelineByOwner(filters, user) {
        return this.reportsService.getPipelineByOwner(filters, user);
    }
    getFilterOptions(user) {
        return this.reportsService.getFilterOptions(user);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('conversion-rates'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getConversionRates", null);
__decorate([
    (0, common_1.Get)('stage-durations'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAverageStageDuration", null);
__decorate([
    (0, common_1.Get)('pipeline-summary'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineSummary", null);
__decorate([
    (0, common_1.Get)('activities/by-user'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getActivitiesByUser", null);
__decorate([
    (0, common_1.Get)('activities'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getActivityReport", null);
__decorate([
    (0, common_1.Get)('pipeline/by-owner'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineByOwner", null);
__decorate([
    (0, common_1.Get)('filter-options'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getFilterOptions", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('report:view'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map