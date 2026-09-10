"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCoreModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const notification_core_service_1 = require("./notification-core.service");
const notification_rule_engine_service_1 = require("./notification-rule-engine.service");
const notification_rules_controller_1 = require("./notification-rules.controller");
const notification_rules_service_1 = require("./notification-rules.service");
const notification_admin_controller_1 = require("./notification-admin.controller");
const notification_admin_service_1 = require("./notification-admin.service");
const notification_template_engine_service_1 = require("./notification-template-engine.service");
const sso_module_1 = require("../auth/sso/sso.module");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const generic_http_sms_provider_1 = require("./sms/generic-http-sms.provider");
const sms_provider_registry_1 = require("./sms/sms-provider.registry");
const sms_recipient_resolver_service_1 = require("./sms/sms-recipient-resolver.service");
const sms_settings_service_1 = require("./sms/sms-settings.service");
const sms_notification_channel_handler_1 = require("./sms/sms-notification-channel.handler");
const notification_delivery_dispatcher_service_1 = require("./notification-delivery-dispatcher.service");
const sms_admin_controller_1 = require("./sms/sms-admin.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const in_app_notification_channel_handler_1 = require("./in-app/in-app-notification-channel.handler");
const notification_action_url_resolver_1 = require("./in-app/notification-action-url.resolver");
const email_module_1 = require("../email/email.module");
const email_notification_channel_handler_1 = require("./email/email-notification-channel.handler");
const push_controller_1 = require("./push/push.controller");
const push_notification_channel_handler_1 = require("./push/push-notification-channel.handler");
const push_provider_registry_1 = require("./push/push-provider.registry");
const push_settings_service_1 = require("./push/push-settings.service");
const web_push_provider_1 = require("./push/web-push.provider");
const notification_policy_condition_validator_service_1 = require("./policy/notification-policy-condition-validator.service");
const notification_policy_context_builder_service_1 = require("./policy/notification-policy-context-builder.service");
const notification_policy_evaluator_service_1 = require("./policy/notification-policy-evaluator.service");
const notification_schedule_validator_service_1 = require("./schedule/notification-schedule-validator.service");
const notification_scheduler_service_1 = require("./schedule/notification-scheduler.service");
let NotificationCoreModule = class NotificationCoreModule {
};
exports.NotificationCoreModule = NotificationCoreModule;
exports.NotificationCoreModule = NotificationCoreModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, sso_module_1.SsoModule, audit_log_module_1.AuditLogModule, notifications_module_1.NotificationsModule, email_module_1.EmailModule],
        controllers: [notification_rules_controller_1.NotificationRulesController, notification_admin_controller_1.NotificationAdminController, notification_admin_controller_1.NotificationTemplatesController, notification_admin_controller_1.NotificationDeliveriesController, sms_admin_controller_1.SmsAdminController, push_controller_1.PushAdminController, push_controller_1.PushSubscriptionController],
        providers: [notification_schedule_validator_service_1.NotificationScheduleValidator, notification_scheduler_service_1.NotificationSchedulerService, notification_policy_condition_validator_service_1.NotificationPolicyConditionValidator, notification_policy_context_builder_service_1.NotificationPolicyContextBuilder, notification_policy_evaluator_service_1.NotificationPolicyEvaluatorService, push_notification_channel_handler_1.PushNotificationChannelHandler, push_provider_registry_1.PushProviderRegistry, push_settings_service_1.PushSettingsService, web_push_provider_1.WebPushProvider, email_notification_channel_handler_1.EmailNotificationChannelHandler, in_app_notification_channel_handler_1.InAppNotificationChannelHandler, notification_action_url_resolver_1.InAppNotificationMetadataMapper, notification_action_url_resolver_1.NotificationActionUrlResolver, notification_core_service_1.NotificationCoreService, notification_rules_service_1.NotificationRulesService, notification_rule_engine_service_1.NotificationRuleEngineService, notification_admin_service_1.NotificationAdminService, notification_template_engine_service_1.NotificationTemplateEngineService, generic_http_sms_provider_1.GenericHttpSmsProvider, sms_provider_registry_1.SmsProviderRegistry, sms_recipient_resolver_service_1.SmsRecipientResolver, sms_settings_service_1.SmsSettingsService, sms_notification_channel_handler_1.SmsNotificationChannelHandler, notification_delivery_dispatcher_service_1.NotificationDeliveryDispatcher],
        exports: [notification_core_service_1.NotificationCoreService, notification_rules_service_1.NotificationRulesService, notification_rule_engine_service_1.NotificationRuleEngineService, notification_template_engine_service_1.NotificationTemplateEngineService, notification_delivery_dispatcher_service_1.NotificationDeliveryDispatcher],
    })
], NotificationCoreModule);
//# sourceMappingURL=notification-core.module.js.map