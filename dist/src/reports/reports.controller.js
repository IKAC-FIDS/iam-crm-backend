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
const advanced_report_filters_dto_1 = require("./dto/advanced-report-filters.dto");
const advanced_reports_service_1 = require("./advanced-reports.service");
const reports_service_1 = require("./reports.service");
const commercial_reports_service_1 = require("./commercial-reports.service");
const data_quality_service_1 = require("./data-quality.service");
const data_quality_dto_1 = require("./dto/data-quality.dto");
const period_comparison_dto_1 = require("./dto/period-comparison.dto");
const period_comparison_service_1 = require("./period-comparison.service");
const report_exports_service_1 = require("./report-exports.service");
let ReportsController = class ReportsController {
    constructor(reportsService, advancedReportsService, commercialReportsService, dataQualityService, periodComparisonService, reportExports) {
        this.reportsService = reportsService;
        this.advancedReportsService = advancedReportsService;
        this.commercialReportsService = commercialReportsService;
        this.dataQualityService = dataQualityService;
        this.periodComparisonService = periodComparisonService;
        this.reportExports = reportExports;
    }
    getDataQualityIssues(query, user) {
        return this.dataQualityService.issues(query, user);
    }
    getDataQuality(query, user) {
        return this.dataQualityService.report(query, user);
    }
    getPeriodComparison(query, user) {
        return this.periodComparisonService.compare(query, user);
    }
    async exportReport(reportKey, query, user, response) {
        const file = await this.reportExports.export(reportKey, query, user);
        response.setHeader("Content-Type", file.contentType);
        response.setHeader("Content-Disposition", file.contentDisposition);
        return new common_1.StreamableFile(file.buffer);
    }
    getFinancialCollections(filters, user) {
        return this.commercialReportsService.financial(filters, user);
    }
    getProductPerformance(filters, user) {
        return this.commercialReportsService.products(filters, user);
    }
    getExchangeRateImpact(filters) {
        return this.commercialReportsService.exchangeImpact(filters);
    }
    getOpportunityForecast(filters, user) {
        return this.advancedReportsService.forecast(filters, user);
    }
    getOpportunityAging(filters, user) {
        return this.advancedReportsService.aging(filters, user);
    }
    getMeetingPerformance(filters, user) {
        return this.advancedReportsService.meetingPerformance(filters, user);
    }
    getTaskPerformance(filters, user) {
        return this.advancedReportsService.taskPerformance(filters, user);
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
    (0, common_1.Get)("data-quality/issues"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [data_quality_dto_1.DataQualityIssuesQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDataQualityIssues", null);
__decorate([
    (0, common_1.Get)("data-quality"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [data_quality_dto_1.DataQualityQueryDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDataQuality", null);
__decorate([
    (0, common_1.Get)("period-comparison"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [period_comparison_dto_1.PeriodComparisonDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPeriodComparison", null);
__decorate([
    (0, common_1.Get)("exports/:reportKey"),
    __param(0, (0, common_1.Param)("reportKey")),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Get)("financial/collections"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getFinancialCollections", null);
__decorate([
    (0, common_1.Get)("products/performance"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getProductPerformance", null);
__decorate([
    (0, common_1.Get)("exchange-rates/impact"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getExchangeRateImpact", null);
__decorate([
    (0, common_1.Get)("opportunities/forecast"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getOpportunityForecast", null);
__decorate([
    (0, common_1.Get)("opportunities/aging"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getOpportunityAging", null);
__decorate([
    (0, common_1.Get)("meetings/performance"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMeetingPerformance", null);
__decorate([
    (0, common_1.Get)("tasks/performance"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getTaskPerformance", null);
__decorate([
    (0, common_1.Get)("conversion-rates"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getConversionRates", null);
__decorate([
    (0, common_1.Get)("stage-durations"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAverageStageDuration", null);
__decorate([
    (0, common_1.Get)("pipeline-summary"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineSummary", null);
__decorate([
    (0, common_1.Get)("activities/by-user"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getActivitiesByUser", null);
__decorate([
    (0, common_1.Get)("activities"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getActivityReport", null);
__decorate([
    (0, common_1.Get)("pipeline/by-owner"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_filters_dto_1.ReportFiltersDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineByOwner", null);
__decorate([
    (0, common_1.Get)("filter-options"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getFilterOptions", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("report:view"),
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        advanced_reports_service_1.AdvancedReportsService,
        commercial_reports_service_1.CommercialReportsService,
        data_quality_service_1.DataQualityService,
        period_comparison_service_1.PeriodComparisonService,
        report_exports_service_1.ReportExportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map