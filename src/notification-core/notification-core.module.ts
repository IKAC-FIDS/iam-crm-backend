import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { NotificationCoreService } from "./notification-core.service"
import { NotificationRuleEngineService } from "./notification-rule-engine.service"
import { NotificationRulesController } from "./notification-rules.controller"
import { NotificationRulesService } from "./notification-rules.service"

@Module({
  imports: [PrismaModule],
  controllers: [NotificationRulesController],
  providers: [NotificationCoreService, NotificationRulesService, NotificationRuleEngineService],
  exports: [NotificationCoreService, NotificationRulesService, NotificationRuleEngineService],
})
export class NotificationCoreModule {}
