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

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("report:view")
@Controller("dashboard")
export class DashboardController {
  constructor(
    private readonly reports: AdvancedReportsService,
    private readonly commercial: CommercialReportsService,
  ) {}

  @Get("summary")
  async getSummary(
    @Query() filters: AdvancedReportFiltersDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const [summary, finance, products, exchange] = await Promise.all([
      this.reports.dashboard(filters, user),
      this.commercial.financial(filters, user),
      this.commercial.products(filters, user),
      this.commercial.exchangeImpact(filters),
    ]);
    const channel = (name: string) =>
      products.byChannel.find((item) => item.salesChannel === name)
        ?.netValueIrr ?? "0";
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
    };
  }
}
