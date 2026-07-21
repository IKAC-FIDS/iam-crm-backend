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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportsService = void 0;
const common_1 = require("@nestjs/common");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const report_export_service_1 = require("../common/export/report-export.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const advanced_reports_service_1 = require("./advanced-reports.service");
const commercial_reports_service_1 = require("./commercial-reports.service");
const data_quality_service_1 = require("./data-quality.service");
const period_comparison_service_1 = require("./period-comparison.service");
const reports_service_1 = require("./reports.service");
const KEYS = [
    "period-comparison",
    "data-quality",
    "opportunity-aging",
    "opportunity-forecast",
    "meeting-performance",
    "task-performance",
    "financial-collections",
    "product-performance",
    "exchange-rate-impact",
    "pipeline-summary",
    "pipeline-by-owner",
    "activities",
    "activities-by-user",
    "stage-durations",
    "conversion-rates",
];
let ReportExportsService = class ReportExportsService {
    constructor(exporter, audit, reports, advanced, commercial, quality, comparison) {
        this.exporter = exporter;
        this.audit = audit;
        this.reports = reports;
        this.advanced = advanced;
        this.commercial = commercial;
        this.quality = quality;
        this.comparison = comparison;
    }
    async export(key, q, user) {
        if (!KEYS.includes(key))
            throw new common_1.BadRequestException("Invalid reportKey");
        const format = q.format === "xlsx" ? "xlsx" : "csv", filters = { ...q, format: undefined };
        const result = await this.run(key, filters, user), workbookSheets = key === "data-quality"
            ? await this.qualitySheets(result, filters, user)
            : key === "period-comparison"
                ? this.comparisonSheets(result)
                : this.genericSheets(key, result, filters), sheets = format === "xlsx"
            ? workbookSheets
            : this.csvSheets(key, workbookSheets);
        const file = this.exporter.create(format, `iam-${key}`, sheets, format === "csv" ? 50000 : 20000);
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: "report",
            action: "report.exported",
            metadata: {
                reportKey: key,
                format,
                rowCount: file.rowCount,
                filters: this.safeFilters(filters),
            },
        });
        return file;
    }
    csvSheets(key, sheets) {
        if (key === "data-quality") {
            return [
                {
                    name: "Issues",
                    rows: sheets
                        .filter((sheet) => sheet.name.endsWith("Issues"))
                        .flatMap((sheet) => sheet.rows),
                },
            ];
        }
        if (key === "period-comparison")
            return [sheets.find((sheet) => sheet.name === "Metrics")];
        return [sheets.find((sheet) => sheet.name === "Report") ?? sheets[0]];
    }
    run(key, q, user) {
        switch (key) {
            case "period-comparison":
                return this.comparison.compare(q, user);
            case "data-quality":
                return this.quality.report(q, user);
            case "opportunity-aging":
                return this.advanced.aging(q, user);
            case "opportunity-forecast":
                return this.advanced.forecast(q, user);
            case "meeting-performance":
                return this.advanced.meetingPerformance(q, user);
            case "task-performance":
                return this.advanced.taskPerformance(q, user);
            case "financial-collections":
                return this.commercial.financial(q, user);
            case "product-performance":
                return this.commercial.products(q, user);
            case "exchange-rate-impact":
                return this.commercial.exchangeImpact(q);
            case "pipeline-summary":
                return this.reports.getPipelineSummary(q, user);
            case "pipeline-by-owner":
                return this.reports.getPipelineByOwner(q, user);
            case "activities":
                return this.reports.getActivityReport(q, user);
            case "activities-by-user":
                return this.reports.getActivitiesByUser(q, user);
            case "stage-durations":
                return this.reports.getAverageStageDuration(q, user);
            case "conversion-rates":
                return this.reports.getConversionRates(q, user);
            default:
                throw new common_1.BadRequestException("Invalid reportKey");
        }
    }
    async qualitySheets(r, q, user) {
        const issueRows = [];
        for (const section of [r.organization, r.globalCatalog].filter(Boolean))
            for (const rule of section.rules) {
                const issues = await this.quality.issues({ ...q, ruleKey: rule.ruleKey, page: 1, limit: 50000 }, user);
                issueRows.push(...issues.data.map((x) => ({
                    scope: x.scope,
                    ruleKey: rule.ruleKey,
                    severity: rule.severity,
                    entityType: x.entityType,
                    title: x.title,
                    company: x.company?.brandName ?? x.company?.legalName ?? "",
                    owner: x.owner?.fullName ?? "",
                    fields: x.fieldNames.join(", "),
                    message: x.message,
                    generatedAt: r.asOf,
                })));
            }
        const summary = (name, s) => [
            {
                scope: name,
                overallScore: s.score.overall,
                eligibleChecks: s.score.eligibleChecks,
                passedChecks: s.score.passedChecks,
                issueOccurrences: s.score.issueOccurrences,
            },
        ];
        return [
            {
                name: "Organization Summary",
                rows: summary("ORGANIZATION", r.organization),
            },
            { name: "Organization Rules", rows: r.organization.rules },
            {
                name: "Organization Issues",
                rows: issueRows.filter((x) => x.scope === "ORGANIZATION"),
            },
            ...(r.globalCatalog
                ? [
                    {
                        name: "Global Catalog Summary",
                        rows: summary("GLOBAL_CATALOG", r.globalCatalog),
                    },
                    { name: "Global Catalog Rules", rows: r.globalCatalog.rules },
                    {
                        name: "Global Catalog Issues",
                        rows: issueRows.filter((x) => x.scope === "GLOBAL_CATALOG"),
                    },
                ]
                : []),
        ];
    }
    comparisonSheets(r) {
        return [
            {
                name: "Periods",
                rows: [
                    {
                        currentStart: r.currentPeriod.startDate,
                        currentEnd: r.currentPeriod.endDate,
                        comparisonStart: r.comparisonPeriod.startDate,
                        comparisonEnd: r.comparisonPeriod.endDate,
                        mode: r.comparisonPeriod.mode,
                    },
                ],
            },
            {
                name: "Metrics",
                rows: r.groups.flatMap((g) => g.metrics.map((m) => ({ group: g.title, ...m }))),
            },
        ];
    }
    genericSheets(key, r, filters) {
        const primary = Array.isArray(r)
            ? r
            : Array.isArray(r.data)
                ? r.data
                : Array.isArray(r.rules)
                    ? r.rules
                    : Array.isArray(r.periods)
                        ? r.periods
                        : Array.isArray(r.byOwner)
                            ? r.byOwner
                            : Array.isArray(r.trend)
                                ? r.trend
                                : [this.flatten(r)];
        return [
            {
                name: "Metadata",
                rows: [
                    {
                        reportKey: key,
                        generatedAt: new Date().toISOString(),
                        filters: JSON.stringify(this.safeFilters(filters)),
                        period: JSON.stringify(r.period ?? null),
                    },
                ],
            },
            { name: "Report", rows: primary },
        ];
    }
    flatten(value, prefix = "", out = {}) {
        if (value == null || typeof value !== "object") {
            out[prefix] = value;
            return out;
        }
        for (const [k, v] of Object.entries(value))
            if (!Array.isArray(v))
                this.flatten(v, prefix ? `${prefix}.${k}` : k, out);
        return out;
    }
    safeFilters(q) {
        return Object.fromEntries(Object.entries(q).filter(([k]) => !/(token|secret|password|authorization|cookie)/i.test(k)));
    }
};
exports.ReportExportsService = ReportExportsService;
exports.ReportExportsService = ReportExportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [report_export_service_1.ReportExportService,
        audit_log_service_1.AuditLogService,
        reports_service_1.ReportsService,
        advanced_reports_service_1.AdvancedReportsService,
        commercial_reports_service_1.CommercialReportsService,
        data_quality_service_1.DataQualityService,
        period_comparison_service_1.PeriodComparisonService])
], ReportExportsService);
//# sourceMappingURL=report-exports.service.js.map