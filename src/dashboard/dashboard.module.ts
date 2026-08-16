import { Module } from "@nestjs/common";
import { ActivitiesModule } from "../activities/activities.module";
import { ReportsModule } from "../reports/reports.module";
import { BoardsDashboardController } from "./boards-dashboard.controller";
import { BoardsDashboardService } from "./boards-dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [ReportsModule, ActivitiesModule],
  controllers: [DashboardController, BoardsDashboardController],
  providers: [DashboardService, BoardsDashboardService],
})
export class DashboardModule {}
