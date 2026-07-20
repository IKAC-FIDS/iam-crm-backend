import { Module } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { AdvancedReportsService } from "./advanced-reports.service";

@Module({
  providers: [ReportsService, AdvancedReportsService],
  controllers: [ReportsController],
  exports: [AdvancedReportsService],
})
export class ReportsModule {}
