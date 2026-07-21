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
const commercial_reports_service_1 = require("../reports/commercial-reports.service");
const data_quality_service_1 = require("../reports/data-quality.service");
const period_comparison_service_1 = require("../reports/period-comparison.service");
let DashboardController = class DashboardController {
    constructor(reports, commercial, quality, comparison) {
        this.reports = reports;
        this.commercial = commercial;
        this.quality = quality;
        this.comparison = comparison;
    }
    async getSummary(filters, user) {
        const [summary, finance, products, exchange, quality, comparison] = await Promise.all([
            this.reports.dashboard(filters, user),
            this.commercial.financial(filters, user),
            this.commercial.products(filters, user),
            this.commercial.exchangeImpact(filters),
            this.quality.report(filters, user),
            this.comparison.compare(filters, user),
        ]);
        const channel = (name) => products.byChannel.find((item) => item.salesChannel === name)
            ?.netValueIrr ?? "0";
        const qualitySummary = (section) => section
            ? {
                overallScore: section.score.overall,
                criticalIssueCount: section.bySeverity.find((x) => x.severity === "CRITICAL")
                    ?.issueOccurrences ?? 0,
                highIssueCount: section.bySeverity.find((x) => x.severity === "HIGH")
                    ?.issueOccurrences ?? 0,
                totalIssueOccurrences: section.score.issueOccurrences,
            }
            : null;
        const comparisonKeys = new Set([
            "OPPORTUNITIES_WON",
            "OPPORTUNITIES_WON_VALUE_IRR",
            "ACTIVITIES_RECORDED",
            "TASKS_COMPLETED",
            "TASK_ON_TIME_COMPLETION_RATE",
            "PAYMENTS_COLLECTED_IRR",
        ]);
        const comparisonMetrics = comparison.groups
            .flatMap((g) => g.metrics)
            .filter((m) => comparisonKeys.has(m.key))
            .map((m) => ({
            key: m.key,
            currentValue: m.currentValue,
            comparisonValue: m.comparisonValue,
            percentChange: m.percentChange,
            direction: m.direction,
            polarity: m.polarity,
            isImprovement: m.isImprovement,
        }));
        return {
            ...summary,
            finance: {
                outstandingAmountIrr: finance.current.outstandingAmountIrr,
                overdueAmountIrr: finance.current.overdueAmountIrr,
                collectedInPeriodAmountIrr: finance.periodFlow.collectedAmountIrr,
                overduePaymentCount: finance.current.overduePaymentCount,
            },
            catalog: {
                activeProductCount: exchange.current.usdProductCount + exchange.current.irrProductCount,
                usdProductCount: exchange.current.usdProductCount,
                irrProductCount: exchange.current.irrProductCount,
                currentExchangeRate: exchange.current.currentRate,
                currentExchangeRateValidFrom: exchange.current.currentValidFrom,
                staleUsdProductCount: exchange.current.staleUsdProductCount,
            },
            salesChannels: {
                wonInPersonAmountIrr: channel("IN_PERSON"),
                wonDigikalaAmountIrr: channel("DIGIKALA"),
                wonOtherAmountIrr: channel("OTHER"),
                wonLegacyUnknownAmountIrr: channel("LEGACY_UNKNOWN"),
            },
            dataQuality: qualitySummary(quality.organization),
            ...(quality.globalCatalog && {
                catalogQuality: qualitySummary(quality.globalCatalog),
            }),
            periodComparison: {
                currentPeriod: comparison.currentPeriod,
                comparisonPeriod: {
                    startDate: comparison.comparisonPeriod.startDate,
                    endDate: comparison.comparisonPeriod.endDate,
                },
                metrics: comparisonMetrics,
            },
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [advanced_report_filters_dto_1.AdvancedReportFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getSummary", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("report:view"),
    (0, common_1.Controller)("dashboard"),
    __metadata("design:paramtypes", [advanced_reports_service_1.AdvancedReportsService,
        commercial_reports_service_1.CommercialReportsService,
        data_quality_service_1.DataQualityService,
        period_comparison_service_1.PeriodComparisonService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map