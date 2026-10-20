"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmsNotificationChannelHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsNotificationChannelHandler = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_template_engine_service_1 = require("../notification-template-engine.service");
const sms_recipient_resolver_service_1 = require("./sms-recipient-resolver.service");
const sms_settings_service_1 = require("./sms-settings.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
let SmsNotificationChannelHandler = SmsNotificationChannelHandler_1 = class SmsNotificationChannelHandler {
    constructor(prisma, templates, contacts, settings) {
        this.prisma = prisma;
        this.templates = templates;
        this.contacts = contacts;
        this.settings = settings;
        this.channel = client_1.NotificationChannel.SMS;
        this.logger = new common_1.Logger(SmsNotificationChannelHandler_1.name);
    }
    async dispatch(deliveryId, organizationId) {
        if (!organizationId)
            throw new common_1.BadRequestException("Organization context is required");
        const context = (0, notification_tenant_context_1.notificationTenantContext)(organizationId);
        const where = { id: deliveryId, channel: client_1.NotificationChannel.SMS, event: { organizationId } };
        const claimed = await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.updateMany({
            where: { ...where, status: { in: [client_1.NotificationDeliveryStatus.PENDING, client_1.NotificationDeliveryStatus.RETRYING] } },
            data: { status: client_1.NotificationDeliveryStatus.PROCESSING, attemptCount: { increment: 1 }, lastAttemptAt: new Date(), processingStartedAt: new Date(), nextAttemptAt: null },
        }));
        if (claimed.count !== 1) {
            const existing = await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.findFirst({ where, select: { status: true, channel: true } }));
            if (!existing)
                throw new common_1.NotFoundException("Notification delivery not found");
            return { deliveryId, status: existing.status, sent: false, reason: "DELIVERY_NOT_CLAIMABLE" };
        }
        const delivery = await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.findFirst({
            where,
            include: { event: true, template: true, recipientUser: { select: { id: true } } },
        }));
        if (!delivery?.recipientUser || !delivery.template)
            return this.skip(deliveryId, organizationId, "INCOMPLETE_DELIVERY", "گیرنده یا قالب پیامک موجود نیست");
        const destination = delivery.destination || await this.contacts.resolve(delivery.event.organizationId, delivery.recipientUser.id);
        if (!destination)
            return this.skip(deliveryId, organizationId, "MISSING_SMS_DESTINATION", "شماره موبایل معتبر برای گیرنده یافت نشد");
        try {
            const rendered = await this.templates.renderStoredTemplate(delivery.event, delivery.recipientUser.id, delivery.template);
            const { provider, config } = await this.settings.configured(delivery.event.organizationId);
            const result = await provider.send(config, { to: destination, message: rendered.body, sender: config.senderNumber, idempotencyKey: delivery.deduplicationKey });
            if (!result.success) {
                await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: client_1.NotificationDeliveryStatus.FAILED, destination, failureCode: result.errorCode ?? "SMS_PROVIDER_FAILED", failureMessage: result.errorMessage?.slice(0, 1000) ?? "ارسال پیامک ناموفق بود", processingStartedAt: null } }));
                this.logger.warn(`SMS failed deliveryId=${deliveryId} organizationId=${delivery.event.organizationId} provider=${provider.code} destination=${this.contacts.mask(destination)} code=${result.errorCode ?? "unknown"}`);
                return { deliveryId, status: client_1.NotificationDeliveryStatus.FAILED, sent: false, reason: result.errorCode ?? "SMS_PROVIDER_FAILED" };
            }
            await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: client_1.NotificationDeliveryStatus.SENT, destination, providerMessageId: result.providerMessageId ?? null, failureCode: null, failureMessage: null, sentAt: new Date(), processingStartedAt: null } }));
            this.logger.log(`SMS sent deliveryId=${deliveryId} organizationId=${delivery.event.organizationId} provider=${provider.code} destination=${this.contacts.mask(destination)} providerMessageId=${result.providerMessageId ?? "none"}`);
            return { deliveryId, status: client_1.NotificationDeliveryStatus.SENT, sent: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message.slice(0, 1000) : "ارسال پیامک ناموفق بود";
            await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: client_1.NotificationDeliveryStatus.FAILED, destination, failureCode: "SMS_DISPATCH_ERROR", failureMessage: message, processingStartedAt: null } }));
            return { deliveryId, status: client_1.NotificationDeliveryStatus.FAILED, sent: false, reason: "SMS_DISPATCH_ERROR" };
        }
    }
    async skip(deliveryId, organizationId, code, message) {
        await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: client_1.NotificationDeliveryStatus.SKIPPED, failureCode: code, failureMessage: message, processingStartedAt: null, nextAttemptAt: null } }));
        return { deliveryId, status: client_1.NotificationDeliveryStatus.SKIPPED, sent: false, reason: code };
    }
};
exports.SmsNotificationChannelHandler = SmsNotificationChannelHandler;
exports.SmsNotificationChannelHandler = SmsNotificationChannelHandler = SmsNotificationChannelHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_template_engine_service_1.NotificationTemplateEngineService,
        sms_recipient_resolver_service_1.SmsRecipientResolver,
        sms_settings_service_1.SmsSettingsService])
], SmsNotificationChannelHandler);
//# sourceMappingURL=sms-notification-channel.handler.js.map