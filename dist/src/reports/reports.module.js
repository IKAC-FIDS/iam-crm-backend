"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const advanced_reports_service_1 = require("./advanced-reports.service");
const commercial_reports_service_1 = require("./commercial-reports.service");
const data_quality_service_1 = require("./data-quality.service");
const period_comparison_service_1 = require("./period-comparison.service");
const reporting_scope_service_1 = require("./reporting-scope.service");
const report_exports_service_1 = require("./report-exports.service");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        providers: [
            reports_service_1.ReportsService,
            advanced_reports_service_1.AdvancedReportsService,
            commercial_reports_service_1.CommercialReportsService,
            reporting_scope_service_1.ReportingScopeService,
            data_quality_service_1.DataQualityService,
            period_comparison_service_1.PeriodComparisonService,
            report_exports_service_1.ReportExportsService,
        ],
        controllers: [reports_controller_1.ReportsController],
        exports: [
            advanced_reports_service_1.AdvancedReportsService,
            commercial_reports_service_1.CommercialReportsService,
            data_quality_service_1.DataQualityService,
            period_comparison_service_1.PeriodComparisonService,
        ],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map