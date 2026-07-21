import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { AdvancedReportsService } from "../reports/advanced-reports.service";
import { AdvancedReportFiltersDto } from "../reports/dto/advanced-report-filters.dto";
import { CommercialReportsService } from "../reports/commercial-reports.service";
import { DataQualityService } from "../reports/data-quality.service";
import { PeriodComparisonService } from "../reports/period-comparison.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("report:view")
@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly reports: AdvancedReportsService,
    private readonly commercial: CommercialReportsService,
    private readonly quality: DataQualityService,
    private readonly comparison: PeriodComparisonService,
  ) {}

  @Get("summary")
  async getSummary(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const [summary, finance, products, exchange, quality, comparison] =
      await Promise.all([
        this.reports.dashboard(filters, user),
        this.commercial.financial(filters, user),
        this.commercial.products(filters, user),
        this.commercial.exchangeImpact(filters),
        this.quality.report(filters, user),
        this.comparison.compare(filters, user),
      ]);
    const channel = (name: string) =>
      products.byChannel.find((item) => item.salesChannel === name)
        ?.netValueIrr ?? "0";
    const qualitySummary = (section: any) =>
      section
        ? {
            overallScore: section.score.overall,
            criticalIssueCount:
              section.bySeverity.find((x: any) => x.severity === "CRITICAL")
                ?.issueOccurrences ?? 0,
            highIssueCount:
              section.bySeverity.find((x: any) => x.severity === "HIGH")
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
      .flatMap((g: any) => g.metrics)
      .filter((m: any) => comparisonKeys.has(m.key))
      .map((m: any) => ({
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
        activeProductCount:
          exchange.current.usdProductCount + exchange.current.irrProductCount,
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
}
