import { Module } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { AdvancedReportsService } from "./advanced-reports.service";
import { CommercialReportsService } from "./commercial-reports.service";

@Module({
  providers: [ReportsService, AdvancedReportsService, CommercialReportsService],
  controllers: [ReportsController],
  exports: [AdvancedReportsService, CommercialReportsService],
})
export class ReportsModule {}
