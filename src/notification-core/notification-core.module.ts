import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { NotificationCoreService } from "./notification-core.service"
import { NotificationRuleEngineService } from "./notification-rule-engine.service"
import { NotificationRulesController } from "./notification-rules.controller"
import { NotificationRulesService } from "./notification-rules.service"
import { NotificationAdminController, NotificationDeliveriesController, NotificationTemplatesController } from "./notification-admin.controller"
import { NotificationAdminService } from "./notification-admin.service"
import { NotificationTemplateEngineService } from "./notification-template-engine.service"
import { SsoModule } from "../auth/sso/sso.module"
import { AuditLogModule } from "../audit-log/audit-log.module"
import { GenericHttpSmsProvider } from "./sms/generic-http-sms.provider"
import { SmsProviderRegistry } from "./sms/sms-provider.registry"
import { SmsRecipientResolver } from "./sms/sms-recipient-resolver.service"
import { SmsSettingsService } from "./sms/sms-settings.service"
import { SmsNotificationChannelHandler } from "./sms/sms-notification-channel.handler"
import { NotificationDeliveryDispatcher } from "./notification-delivery-dispatcher.service"
import { SmsAdminController } from "./sms/sms-admin.controller"
import { NotificationsModule } from '../notifications/notifications.module'
import { InAppNotificationChannelHandler } from './in-app/in-app-notification-channel.handler'
import { InAppNotificationMetadataMapper, NotificationActionUrlResolver } from './in-app/notification-action-url.resolver'
import { EmailModule } from '../email/email.module'
import { EmailNotificationChannelHandler } from './email/email-notification-channel.handler'

@Module({
  imports: [PrismaModule, SsoModule, AuditLogModule, NotificationsModule, EmailModule],
  controllers: [NotificationRulesController, NotificationAdminController, NotificationTemplatesController, NotificationDeliveriesController, SmsAdminController],
  providers: [EmailNotificationChannelHandler, InAppNotificationChannelHandler, InAppNotificationMetadataMapper, NotificationActionUrlResolver, NotificationCoreService, NotificationRulesService, NotificationRuleEngineService, NotificationAdminService, NotificationTemplateEngineService, GenericHttpSmsProvider, SmsProviderRegistry, SmsRecipientResolver, SmsSettingsService, SmsNotificationChannelHandler, NotificationDeliveryDispatcher],
  exports: [NotificationCoreService, NotificationRulesService, NotificationRuleEngineService, NotificationTemplateEngineService, NotificationDeliveryDispatcher],
})
export class NotificationCoreModule {}
