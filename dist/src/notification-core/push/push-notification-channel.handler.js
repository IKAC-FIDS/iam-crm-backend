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
var PushNotificationChannelHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationChannelHandler = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_action_url_resolver_1 = require("../in-app/notification-action-url.resolver");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
const notification_template_engine_service_1 = require("../notification-template-engine.service");
const push_settings_service_1 = require("./push-settings.service");
let PushNotificationChannelHandler = PushNotificationChannelHandler_1 = class PushNotificationChannelHandler {
    constructor(prisma, templates, urls, push) {
        this.prisma = prisma;
        this.templates = templates;
        this.urls = urls;
        this.push = push;
        this.channel = client_1.NotificationChannel.PUSH;
        this.logger = new common_1.Logger(PushNotificationChannelHandler_1.name);
    }
    async dispatch(deliveryId, organizationId) {
        if (!organizationId)
            throw new common_1.BadRequestException("Organization context is required");
        const context = (0, notification_tenant_context_1.notificationTenantContext)(organizationId);
        const where = { id: deliveryId, channel: this.channel, event: { organizationId } };
        const prepared = await this.prisma.withTenantTransaction(context, async (tx) => {
            const claim = await tx.notificationDelivery.updateMany({ where: { ...where, status: { in: [client_1.NotificationDeliveryStatus.PENDING, client_1.NotificationDeliveryStatus.RETRYING, client_1.NotificationDeliveryStatus.FAILED] } }, data: { status: client_1.NotificationDeliveryStatus.PROCESSING, attemptCount: { increment: 1 }, lastAttemptAt: new Date() } });
            const delivery = await tx.notificationDelivery.findFirst({ where, include: { event: true, template: true } });
            if (!delivery)
                throw new common_1.NotFoundException("Notification delivery not found");
            if (!claim.count)
                return { delivery, rendered: null, endpoints: [], claimable: false };
            if (!delivery.recipientUserId || !delivery.template)
                return { delivery, rendered: null, endpoints: [], claimable: true };
            const endpoints = await this.push.endpoints(context, delivery.recipientUserId, tx);
            const rendered = await this.templates.renderStoredTemplate(delivery.event, delivery.recipientUserId, delivery.template, tx);
            return { delivery, rendered, endpoints, claimable: true };
        });
        if (!prepared.claimable)
            return { deliveryId, status: prepared.delivery.status, sent: false, reason: "DELIVERY_NOT_CLAIMABLE" };
        if (!prepared.delivery.recipientUserId)
            return this.finish(context, deliveryId, client_1.NotificationDeliveryStatus.SKIPPED, "RECIPIENT_NOT_FOUND", "گیرنده اعلان پوش یافت نشد");
        if (!prepared.rendered?.subject?.trim())
            return this.finish(context, deliveryId, client_1.NotificationDeliveryStatus.SKIPPED, "INVALID_PUSH_TEMPLATE", "عنوان قالب پوش معتبر نیست");
        if (!prepared.endpoints.length)
            return this.finish(context, deliveryId, client_1.NotificationDeliveryStatus.SKIPPED, "NO_PUSH_ENDPOINT", "گیرنده دستگاه فعال برای اعلان پوش ندارد");
        const actionUrl = this.urls.resolve(prepared.delivery.event);
        if (!actionUrl)
            return this.finish(context, deliveryId, client_1.NotificationDeliveryStatus.SKIPPED, "INVALID_ACTION_URL", "مسیر داخلی اعلان معتبر نیست");
        let providerData;
        try {
            providerData = await this.push.configured(context);
        }
        catch (error) {
            return this.finish(context, deliveryId, client_1.NotificationDeliveryStatus.FAILED, "PUSH_NOT_CONFIGURED", error instanceof Error ? error.message : "کانال پوش پیکربندی نشده است");
        }
        const results = await Promise.all(prepared.endpoints.map(async (endpoint) => {
            try {
                return await providerData.provider.send({ recipientUserId: prepared.delivery.recipientUserId, endpointId: endpoint.id, subscription: this.push.decodeEndpoint(endpoint.endpointEnc), title: prepared.rendered.subject, body: prepared.rendered.body, actionUrl, data: { eventId: prepared.delivery.eventId, aggregateType: prepared.delivery.event.aggregateType, aggregateId: prepared.delivery.event.aggregateId }, idempotencyKey: `${prepared.delivery.deduplicationKey}:${endpoint.id}` }, providerData.config);
            }
            catch {
                this.logger.warn(`PUSH endpoint failed deliveryId=${deliveryId} endpointId=${endpoint.id}`);
                return { success: false, invalidEndpoint: false, errorCode: "PUSH_ENDPOINT_FAILED", errorMessage: "ارسال به مقصد پوش ناموفق بود" };
            }
        }));
        const invalidIds = prepared.endpoints.filter((_, index) => results[index]?.invalidEndpoint).map(item => item.id);
        if (invalidIds.length)
            await this.prisma.withTenantTransaction(context, tx => this.push.deactivate(context, invalidIds, tx));
        const successes = results.filter(item => item.success);
        const status = successes.length ? client_1.NotificationDeliveryStatus.SENT : client_1.NotificationDeliveryStatus.FAILED;
        const failureCode = successes.length ? null : results[0]?.errorCode ?? "PUSH_PROVIDER_FAILED";
        const failureMessage = successes.length ? (successes.length < results.length ? `${successes.length} از ${results.length} مقصد دریافت کردند` : null) : results[0]?.errorMessage ?? "ارسال اعلان پوش ناموفق بود";
        await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status, destination: `${successes.length}/${results.length} endpoints`, providerMessageId: successes.map(item => item.providerMessageId).filter(Boolean).join(",").slice(0, 1000) || null, sentAt: successes.length ? new Date() : null, failureCode, failureMessage } }));
        this.logger.log(`PUSH processed deliveryId=${deliveryId} organizationId=${organizationId} successful=${successes.length} attempted=${results.length}`);
        return { deliveryId, status, sent: successes.length > 0, reason: failureCode ?? undefined };
    }
    async finish(context, id, status, code, message) {
        await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.update({ where: { id }, data: { status, failureCode: code, failureMessage: message } }));
        return { deliveryId: id, status, sent: false, reason: code };
    }
};
exports.PushNotificationChannelHandler = PushNotificationChannelHandler;
exports.PushNotificationChannelHandler = PushNotificationChannelHandler = PushNotificationChannelHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_template_engine_service_1.NotificationTemplateEngineService, notification_action_url_resolver_1.NotificationActionUrlResolver, push_settings_service_1.PushSettingsService])
], PushNotificationChannelHandler);
//# sourceMappingURL=push-notification-channel.handler.js.map