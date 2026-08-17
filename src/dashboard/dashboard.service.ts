import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ActivitiesService } from "../activities/activities.service";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { AdvancedReportFiltersDto } from "../reports/dto/advanced-report-filters.dto";
import { ReportingScopeService } from "../reports/reporting-scope.service";

@Injectable()
export class DashboardService {
  constructor(
    private readonly activities: ActivitiesService,
    private readonly prisma: PrismaService,
    private readonly scopes: ReportingScopeService,
  ) {}

  latestActivities(user: CurrentUserPayload) {
    return this.activities.latestActivities(user);
  }

  async managementSummary(
    filters: AdvancedReportFiltersDto,
    user: CurrentUserPayload,
  ) {
    const now = new Date();

    /**
     * The management snapshot is deliberately cumulative/current-state.
     * startDate/endDate are not used by ReportingScopeService.opportunity(),
     * while organization/company/owner/team/stage/priority/etc. filters are.
     */
    const portfolioScope: Prisma.OpportunityWhereInput = {
      AND: [
        this.scopes.opportunity(filters, user),
        {
          archivedAt: null,
          company: { archivedAt: null },
        },
      ],
    };

    const trendStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    );

    const [
      portfolioOpportunities,
      createdTrendOpportunities,
      wonTrendOpportunities,
      lostTrendOpportunities,
    ] = await Promise.all([
      this.prisma.opportunity.findMany({
        where: portfolioScope,
        select: {
          estimatedValue: true,
          stage: {
            select: {
              isTerminal: true,
              terminalType: true,
            },
          },
        },
      }),

      this.prisma.opportunity.findMany({
        where: {
          AND: [portfolioScope, { createdAt: { gte: trendStart } }],
        },
        select: {
          createdAt: true,
          estimatedValue: true,
        },
      }),

      this.prisma.opportunity.findMany({
        where: {
          AND: [
            portfolioScope,
            {
              wonAt: { gte: trendStart },
              stage: { terminalType: "WON" },
            },
          ],
        },
        select: {
          wonAt: true,
          estimatedValue: true,
        },
      }),

      this.prisma.opportunity.findMany({
        where: {
          AND: [
            portfolioScope,
            {
              lostAt: { gte: trendStart },
              stage: { terminalType: "LOST" },
            },
          ],
        },
        select: {
          lostAt: true,
          estimatedValue: true,
        },
      }),
    ]);

    const activePortfolio = portfolioOpportunities.filter(
      (opportunity) => !opportunity.stage.isTerminal,
    );

    const wonPortfolio = portfolioOpportunities.filter(
      (opportunity) => opportunity.stage.terminalType === "WON",
    );

    const lostPortfolio = portfolioOpportunities.filter(
      (opportunity) => opportunity.stage.terminalType === "LOST",
    );

    const totalPortfolioCount = portfolioOpportunities.length;

    const monthBuckets = Array.from({ length: 12 }, (_, index) => {
      const start = new Date(
        Date.UTC(
          trendStart.getUTCFullYear(),
          trendStart.getUTCMonth() + index,
          1,
        ),
      );

      const end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
      );

      return { start, end };
    });

    const inBucket = (
      date: Date | null,
      start: Date,
      end: Date,
    ): boolean => Boolean(date && date >= start && date < end);

    const opportunityTrend12m = monthBuckets.map(({ start, end }) => {
      const createdRows = createdTrendOpportunities.filter((opportunity) =>
        inBucket(opportunity.createdAt, start, end),
      );

      const wonRows = wonTrendOpportunities.filter((opportunity) =>
        inBucket(opportunity.wonAt, start, end),
      );

      const lostRows = lostTrendOpportunities.filter((opportunity) =>
        inBucket(opportunity.lostAt, start, end),
      );

      return {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),

        createdCount: createdRows.length,
        wonCount: wonRows.length,
        lostCount: lostRows.length,

        createdValueIrr: this.money(createdRows).toString(),
        wonValueIrr: this.money(wonRows).toString(),
        lostValueIrr: this.money(lostRows).toString(),
      };
    });

    return {
      portfolio: {
        total: {
          count: totalPortfolioCount,
          estimatedValueIrr: this.money(portfolioOpportunities).toString(),
        },

        active: {
          count: activePortfolio.length,
          estimatedValueIrr: this.money(activePortfolio).toString(),
          percentage: this.percent(
            activePortfolio.length,
            totalPortfolioCount,
          ),
        },

        won: {
          count: wonPortfolio.length,
          estimatedValueIrr: this.money(wonPortfolio).toString(),
          percentage: this.percent(wonPortfolio.length, totalPortfolioCount),
        },

        lost: {
          count: lostPortfolio.length,
          estimatedValueIrr: this.money(lostPortfolio).toString(),
          percentage: this.percent(lostPortfolio.length, totalPortfolioCount),
        },
      },

      opportunityTrend12m,
    };
  }

  private money(
    rows: Array<{ estimatedValue: Prisma.Decimal | null }>,
  ): Prisma.Decimal {
    return rows.reduce(
      (sum, row) => sum.plus(row.estimatedValue ?? 0),
      new Prisma.Decimal(0),
    );
  }

  private percent(part: number, total: number): number {
    return total ? Math.round((part / total) * 100) : 0;
  }
}
