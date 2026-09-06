import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { NotificationCoreService } from "./notification-core.service"
import { NotificationRuleEngineService } from "./notification-rule-engine.service"
import { NotificationRulesController } from "./notification-rules.controller"
import { NotificationRulesService } from "./notification-rules.service"
import { NotificationAdminController, NotificationDeliveriesController, NotificationTemplatesController } from "./notification-admin.controller"
import { NotificationAdminService } from "./notification-admin.service"
import { NotificationTemplateEngineService } from "./notification-template-engine.service"

@Module({
  imports: [PrismaModule],
  controllers: [NotificationRulesController, NotificationAdminController, NotificationTemplatesController, NotificationDeliveriesController],
  providers: [NotificationCoreService, NotificationRulesService, NotificationRuleEngineService, NotificationAdminService, NotificationTemplateEngineService],
  exports: [NotificationCoreService, NotificationRulesService, NotificationRuleEngineService, NotificationTemplateEngineService],
})
export class NotificationCoreModule {}
