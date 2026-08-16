import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { AdvancedReportsService } from "../reports/advanced-reports.service";
import { CommercialReportsService } from "../reports/commercial-reports.service";
import { AdvancedReportFiltersDto } from "../reports/dto/advanced-report-filters.dto";
import { PeriodComparisonService } from "../reports/period-comparison.service";
import { ReportingScopeService } from "../reports/reporting-scope.service";

type PeriodRange = {
  gte?: Date;
  lte?: Date;
  lt?: Date;
};

@Injectable()
export class BoardsDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advancedReports: AdvancedReportsService,
    private readonly commercialReports: CommercialReportsService,
    private readonly comparison: PeriodComparisonService,
    private readonly scopes: ReportingScopeService,
  ) {}

  async overview(
    filters: AdvancedReportFiltersDto,
    user: CurrentUserPayload,
  ) {
    const effectiveFilters = this.withDefaultPeriod(filters);
    const trendRange = this.trendRange();
    const historicalScope = this.scopes.opportunity(
      effectiveFilters,
      user,
      false,
    );
    const activeScope = this.scopes.opportunity(effectiveFilters, user, true);

    const [
      summary,
      finance,
      products,
      periodComparison,
      activeRows,
      trendRows,
    ] = await Promise.all([
      this.advancedReports.dashboard(effectiveFilters, user),
      this.commercialReports.financial(effectiveFilters, user),
      this.commercialReports.products(effectiveFilters, user),
      this.comparison.compare(effectiveFilters, user),
      this.prisma.opportunity.findMany({
        where: activeScope,
        select: {
          id: true,
          source: true,
          estimatedValue: true,
          probability: true,
          stageId: true,
          stage: {
            select: {
              code: true,
              label: true,
              sortOrder: true,
            },
          },
          ownerId: true,
          owner: {
            select: {
              fullName: true,
              team: true,
            },
          },
          company: {
            select: {
              industry: true,
            },
          },
        },
      }),
      this.prisma.opportunity.findMany({
        where: {
          AND: [
            historicalScope,
            {
              OR: [
                { createdAt: trendRange },
                { wonAt: trendRange },
                { lostAt: trendRange },
              ],
            },
          ],
        },
        select: {
          createdAt: true,
          wonAt: true,
          lostAt: true,
          estimatedValue: true,
        },
      }),
    ]);

    const sources = this.groupActiveRows(
      activeRows,
      (row) => row.source?.trim() || "UNKNOWN",
      "source",
    );
    const industries = this.groupActiveRows(
      activeRows,
      (row) => row.company.industry?.trim() || "UNKNOWN",
      "industry",
    );

    const comparisonMap = new Map(
      periodComparison.groups
        .flatMap((group: any) => group.metrics)
        .map((metric: any) => [metric.key, metric]),
    );

    const metric = (
      key: string,
      value: string | number,
      fallbackUnit: "COUNT" | "IRR" | "PERCENT",
    ) => {
      const comparison = comparisonMap.get(key) as any;

      return {
        value,
        previousValue: comparison?.comparisonValue ?? null,
        changePercent: comparison?.percentChange ?? null,
        direction: comparison?.direction ?? "FLAT",
        polarity: comparison?.polarity ?? "NEUTRAL",
        isImprovement: comparison?.isImprovement ?? null,
        unit: fallbackUnit,
      };
    };

    const topProducts = [...products.byProduct]
      .sort((a, b) =>
        new Prisma.Decimal(b.wonNetValueIrr).cmp(
          new Prisma.Decimal(a.wonNetValueIrr),
        ),
      )
      .slice(0, 10);

    return {
      generatedAt: new Date().toISOString(),
      audience: "BOARDS",
      responseVersion: "2.0",
      period: {
        ...summary.period,
        defaultApplied: !filters.startDate && !filters.endDate,
        defaultDays: 30,
      },

      executive: {
        activePipeline: {
          count: metric(
            "ACTIVE_OPPORTUNITIES",
            summary.current.activeOpportunities.count,
            "COUNT",
          ),
          valueIrr: metric(
            "ACTIVE_OPPORTUNITIES_VALUE_IRR",
            summary.current.activeOpportunities.estimatedValueIrr,
            "IRR",
          ),
          weightedValueIrr: metric(
            "ACTIVE_OPPORTUNITIES_WEIGHTED_VALUE_IRR",
            summary.current.activeOpportunities.weightedValueIrr,
            "IRR",
          ),
        },

        periodSales: {
          createdCount: metric(
            "OPPORTUNITIES_CREATED",
            summary.periodPerformance.opportunities.createdCount,
            "COUNT",
          ),
          wonCount: metric(
            "OPPORTUNITIES_WON",
            summary.periodPerformance.opportunities.wonCount,
            "COUNT",
          ),
          lostCount: metric(
            "OPPORTUNITIES_LOST",
            summary.periodPerformance.opportunities.lostCount,
            "COUNT",
          ),
          wonValueIrr: metric(
            "OPPORTUNITIES_WON_VALUE_IRR",
            summary.periodPerformance.opportunities.wonEstimatedValueIrr,
            "IRR",
          ),
          winRate: metric(
            "OPPORTUNITY_WIN_RATE",
            summary.periodPerformance.opportunities.winRate,
            "PERCENT",
          ),
        },

        forecast: {
          opportunityCount: {
            value: summary.forecast.opportunityCount,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEUTRAL",
            isImprovement: null,
            unit: "COUNT",
          },
          estimatedValueIrr: {
            value: summary.forecast.estimatedValueIrr,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEUTRAL",
            isImprovement: null,
            unit: "IRR",
          },
          weightedValueIrr: {
            value: summary.forecast.weightedValueIrr,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEUTRAL",
            isImprovement: null,
            unit: "IRR",
          },
        },

        finance: {
          collectedAmountIrr: metric(
            "PAYMENTS_COLLECTED_IRR",
            finance.periodFlow.collectedAmountIrr,
            "IRR",
          ),
          collectionRate: {
            value: finance.periodFlow.collectionRate,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEUTRAL",
            isImprovement: null,
            unit: "PERCENT",
          },
          outstandingAmountIrr: {
            value: finance.current.outstandingAmountIrr,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEUTRAL",
            isImprovement: null,
            unit: "IRR",
          },
          overdueAmountIrr: {
            value: finance.current.overdueAmountIrr,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEGATIVE",
            isImprovement: null,
            unit: "IRR",
          },
          overduePaymentCount: {
            value: finance.current.overduePaymentCount,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEGATIVE",
            isImprovement: null,
            unit: "COUNT",
          },
        },

        execution: {
          openTaskCount: {
            value: summary.current.tasks.openCount,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEUTRAL",
            isImprovement: null,
            unit: "COUNT",
          },
          overdueTaskCount: {
            value: summary.current.tasks.overdueCount,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "NEGATIVE",
            isImprovement: null,
            unit: "COUNT",
          },
          taskOnTimeCompletionRate: metric(
            "TASK_ON_TIME_COMPLETION_RATE",
            summary.periodPerformance.tasks.onTimeCompletionRate,
            "PERCENT",
          ),
          meetingExecutionRate: {
            value: summary.periodPerformance.meetings.executionRate,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "POSITIVE",
            isImprovement: null,
            unit: "PERCENT",
          },
          meetingsCompletedCount: {
            value: summary.periodPerformance.meetings.completedCount,
            previousValue: null,
            changePercent: null,
            direction: "FLAT",
            polarity: "POSITIVE",
            isImprovement: null,
            unit: "COUNT",
          },
        },
      },

      gauges: [
        {
          key: "WIN_RATE",
          label: "نرخ موفقیت فرصت‌ها",
          ...metric(
            "OPPORTUNITY_WIN_RATE",
            summary.periodPerformance.opportunities.winRate,
            "PERCENT",
          ),
        },
        {
          key: "TASK_ON_TIME_COMPLETION_RATE",
          label: "انجام به‌موقع وظایف",
          ...metric(
            "TASK_ON_TIME_COMPLETION_RATE",
            summary.periodPerformance.tasks.onTimeCompletionRate,
            "PERCENT",
          ),
        },
        {
          key: "MEETING_EXECUTION_RATE",
          label: "نرخ اجرای جلسات",
          value: summary.periodPerformance.meetings.executionRate,
          previousValue: null,
          changePercent: null,
          direction: "FLAT",
          polarity: "POSITIVE",
          isImprovement: null,
          unit: "PERCENT",
        },
        {
          key: "COLLECTION_RATE",
          label: "نرخ وصول",
          value: finance.periodFlow.collectionRate,
          previousValue: null,
          changePercent: null,
          direction: "FLAT",
          polarity: "POSITIVE",
          isImprovement: null,
          unit: "PERCENT",
        },
      ],

      funnel: this.stageFunnel(activeRows),

      monthlyTrend: this.monthlyTrend(trendRows, trendRange.gte!),

      sourceDistribution: sources,
      industryDistribution: industries,

      ownerPerformance: this.ownerPerformance(activeRows),

      commercial: {
        salesChannels: products.byChannel,
        topProducts,
        wonSales: products.wonSales,
        activePipeline: products.activePipeline,
        salesTrend: products.trend,
      },

      finance: {
        current: finance.current,
        periodFlow: finance.periodFlow,
        aging: finance.aging,
        trend: finance.trend,
      },

      periodComparison,

      attention: {
        overdueOpportunities: summary.attention.overdueOpportunities,
        overdueTasks: summary.attention.overdueTasks,
        pastScheduledMeetings: summary.attention.pastScheduledMeetings,
        overdueCloseCount: summary.forecast.overdueCloseCount,
        opportunitiesWithoutCloseDate:
          summary.forecast.withoutCloseDateCount,
      },

      presentation: {
        recommendedCharts: {
          executive: "KPI_CARDS",
          gauges: "GAUGE",
          funnel: "FUNNEL",
          monthlyTrend: "MULTI_SERIES_COLUMN_OR_LINE",
          sourceDistribution: "DONUT_OR_BAR",
          industryDistribution: "HORIZONTAL_BAR",
          ownerPerformance: "HORIZONTAL_BAR",
          salesChannels: "DONUT_OR_COLUMN",
          topProducts: "HORIZONTAL_BAR",
          financialTrend: "MULTI_SERIES_LINE",
          aging: "STACKED_BAR_OR_COLUMN",
          periodComparison: "DELTA_KPI_OR_COMPARISON_BAR",
        },
        contractNote:
          "Presentation hints are non-binding. The frontend owns final visualization choices.",
      },
    };
  }

  private withDefaultPeriod(
    filters: AdvancedReportFiltersDto,
  ): AdvancedReportFiltersDto {
    if (filters.startDate || filters.endDate) return filters;

    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86_400_000);

    return {
      ...filters,
      startDate: this.dateOnly(start),
      endDate: this.dateOnly(end),
    };
  }

  private trendRange(): Required<Pick<PeriodRange, "gte" | "lt">> {
    const end = new Date();
    const start = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth() - 11,
        1,
        0,
        0,
        0,
        0,
      ),
    );
    const nextMonth = new Date(
      Date.UTC(
        end.getUTCFullYear(),
        end.getUTCMonth() + 1,
        1,
        0,
        0,
        0,
        0,
      ),
    );

    return { gte: start, lt: nextMonth };
  }

  private stageFunnel(
    rows: Array<{
      stageId: string;
      stage: {
        code: string;
        label: string;
        sortOrder: number;
      };
      estimatedValue: Prisma.Decimal | null;
      probability: number | null;
    }>,
  ) {
    const groups = new Map<string, typeof rows>();

    for (const row of rows) {
      groups.set(row.stageId, [...(groups.get(row.stageId) ?? []), row]);
    }

    return [...groups.entries()]
      .map(([stageId, groupedRows]) => ({
        stageId,
        code: groupedRows[0].stage.code,
        label: groupedRows[0].stage.label,
        sortOrder: groupedRows[0].stage.sortOrder,
        opportunityCount: groupedRows.length,
        estimatedValueIrr: this.sumEstimated(groupedRows).toString(),
        weightedValueIrr: this.sumWeighted(groupedRows).toString(),
        sharePercent: this.percent(groupedRows.length, rows.length),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private ownerPerformance(
    rows: Array<{
      ownerId: string | null;
      owner: {
        fullName: string;
        team: string | null;
      } | null;
      estimatedValue: Prisma.Decimal | null;
      probability: number | null;
    }>,
  ) {
    const groups = new Map<string, typeof rows>();

    for (const row of rows) {
      const key = row.ownerId ?? "UNASSIGNED";
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    return [...groups.entries()]
      .map(([key, groupedRows]) => ({
        ownerId: key === "UNASSIGNED" ? null : key,
        ownerName: groupedRows[0].owner?.fullName ?? "Unassigned",
        team: groupedRows[0].owner?.team ?? null,
        opportunityCount: groupedRows.length,
        estimatedValueIrr: this.sumEstimated(groupedRows).toString(),
        weightedValueIrr: this.sumWeighted(groupedRows).toString(),
        sharePercent: this.percent(groupedRows.length, rows.length),
      }))
      .sort((a, b) =>
        new Prisma.Decimal(b.weightedValueIrr).cmp(
          new Prisma.Decimal(a.weightedValueIrr),
        ),
      );
  }

  private groupActiveRows<
    T extends {
      estimatedValue: Prisma.Decimal | null;
      probability: number | null;
    },
  >(
    rows: T[],
    keyOf: (row: T) => string,
    keyName: "source" | "industry",
  ) {
    const groups = new Map<string, T[]>();

    for (const row of rows) {
      const key = keyOf(row);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    return [...groups.entries()]
      .map(([key, groupedRows]) => {
        const estimatedValueIrr = this.sumEstimated(groupedRows);
        const weightedValueIrr = this.sumWeighted(groupedRows);

        return {
          [keyName]: key,
          opportunityCount: groupedRows.length,
          estimatedValueIrr: estimatedValueIrr.toString(),
          weightedValueIrr: weightedValueIrr.toString(),
          sharePercent: this.percent(groupedRows.length, rows.length),
        };
      })
      .sort((a, b) => b.opportunityCount - a.opportunityCount);
  }

  private monthlyTrend(
    rows: Array<{
      createdAt: Date;
      wonAt: Date | null;
      lostAt: Date | null;
      estimatedValue: Prisma.Decimal | null;
    }>,
    start: Date,
  ) {
    const buckets = Array.from({ length: 12 }, (_, index) => {
      const periodStart = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth() + index,
          1,
        ),
      );
      const periodEnd = new Date(
        Date.UTC(
          periodStart.getUTCFullYear(),
          periodStart.getUTCMonth() + 1,
          1,
        ),
      );

      const created = rows.filter(
        (row) => row.createdAt >= periodStart && row.createdAt < periodEnd,
      );
      const won = rows.filter(
        (row) =>
          row.wonAt && row.wonAt >= periodStart && row.wonAt < periodEnd,
      );
      const lost = rows.filter(
        (row) =>
          row.lostAt && row.lostAt >= periodStart && row.lostAt < periodEnd,
      );

      return {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        label: periodStart.toISOString().slice(0, 7),
        createdCount: created.length,
        wonCount: won.length,
        lostCount: lost.length,
        createdValueIrr: this.sumEstimated(created).toString(),
        wonValueIrr: this.sumEstimated(won).toString(),
        lostValueIrr: this.sumEstimated(lost).toString(),
      };
    });

    return buckets;
  }

  private sumEstimated<T extends { estimatedValue: Prisma.Decimal | null }>(
    rows: T[],
  ) {
    return rows.reduce(
      (total, row) => total.plus(row.estimatedValue ?? 0),
      new Prisma.Decimal(0),
    );
  }

  private sumWeighted<
    T extends {
      estimatedValue: Prisma.Decimal | null;
      probability: number | null;
    },
  >(rows: T[]) {
    return rows.reduce(
      (total, row) =>
        total.plus(
          row.estimatedValue
            ? row.estimatedValue.mul(row.probability ?? 0).div(100)
            : 0,
        ),
      new Prisma.Decimal(0),
    );
  }

  private percent(part: number, total: number) {
    return total ? Math.round((part / total) * 10000) / 100 : 0;
  }

  private dateOnly(date: Date) {
    return date.toISOString().slice(0, 10);
  }
}
