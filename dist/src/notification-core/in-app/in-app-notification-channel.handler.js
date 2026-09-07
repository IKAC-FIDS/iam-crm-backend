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
var InAppNotificationChannelHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppNotificationChannelHandler = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const notification_template_engine_service_1 = require("../notification-template-engine.service");
const notification_action_url_resolver_1 = require("./notification-action-url.resolver");
const notification_tenant_context_1 = require("./notification-tenant-context");
let InAppNotificationChannelHandler = InAppNotificationChannelHandler_1 = class InAppNotificationChannelHandler {
    constructor(prisma, templates, notifications, urls, metadata) {
        this.prisma = prisma;
        this.templates = templates;
        this.notifications = notifications;
        this.urls = urls;
        this.metadata = metadata;
        this.channel = client_1.NotificationChannel.IN_APP;
        this.logger = new common_1.Logger(InAppNotificationChannelHandler_1.name);
    }
    async dispatch(deliveryId, organizationId) {
        if (!organizationId)
            throw new common_1.BadRequestException('Organization context is required');
        const context = (0, notification_tenant_context_1.notificationTenantContext)(organizationId);
        const where = { id: deliveryId, channel: this.channel, event: { organizationId } };
        try {
            return await this.prisma.withTenantTransaction(context, async (tx) => {
                const claim = await tx.notificationDelivery.updateMany({ where: { ...where, status: { in: [client_1.NotificationDeliveryStatus.PENDING, client_1.NotificationDeliveryStatus.RETRYING, client_1.NotificationDeliveryStatus.FAILED] } },
                    data: { status: client_1.NotificationDeliveryStatus.PROCESSING, attemptCount: { increment: 1 }, lastAttemptAt: new Date() } });
                const delivery = await tx.notificationDelivery.findFirst({ where, include: { event: true, template: true } });
                if (!delivery)
                    throw new common_1.NotFoundException('Notification delivery not found');
                if (!claim.count)
                    return { deliveryId, status: delivery.status, sent: false, reason: 'DELIVERY_NOT_CLAIMABLE' };
                const skip = async (code) => {
                    await tx.notificationDelivery.update({ where: { id: deliveryId }, data: { status: client_1.NotificationDeliveryStatus.SKIPPED, failureCode: code, failureMessage: code } });
                    return { deliveryId, status: client_1.NotificationDeliveryStatus.SKIPPED, sent: false, reason: code };
                };
                if (!delivery.recipientUserId)
                    return skip('RECIPIENT_NOT_FOUND');
                const recipient = await tx.user.findFirst({ where: { id: delivery.recipientUserId, isActive: true,
                        organizationMemberships: { some: { organizationId, status: 'ACTIVE' } } }, select: { id: true } });
                if (!recipient)
                    return skip('RECIPIENT_NOT_FOUND');
                const template = delivery.template;
                if (!template || template.channel !== this.channel || !template.isActive || template.organizationId !== organizationId || template.eventName !== delivery.event.eventName)
                    return skip('IN_APP_TEMPLATE_NOT_FOUND');
                this.templates.validate(delivery.event.eventName, template.subject, template.body);
                const rendered = await this.templates.renderStoredTemplate(delivery.event, recipient.id, template, tx);
                if (!rendered.subject?.trim() || rendered.missingVariables.length)
                    return skip('INVALID_TEMPLATE_CONTEXT');
                const actionUrl = this.urls.resolve(delivery.event);
                if (!actionUrl)
                    return skip('INVALID_ACTION_URL');
                const actor = delivery.event.actorId ? await tx.user.findFirst({ where: { id: delivery.event.actorId,
                        organizationMemberships: { some: { organizationId, status: 'ACTIVE' } } }, select: { id: true } }) : null;
                const notification = await this.notifications.createInternal({
                    organizationId, recipientId: recipient.id, actorId: actor?.id, title: rendered.subject, body: rendered.body,
                    ...this.metadata.map(delivery.event), actionUrl,
                    metadata: { source: 'NOTIFICATION_CORE', eventId: delivery.eventId, deliveryId, deduplicationKey: delivery.deduplicationKey },
                }, tx);
                if (!notification)
                    return skip('RECIPIENT_NOT_FOUND');
                const now = new Date();
                await tx.notificationDelivery.update({ where: { id: deliveryId }, data: {
                        status: client_1.NotificationDeliveryStatus.DELIVERED, sentAt: now, deliveredAt: now, providerMessageId: notification.id,
                        destination: recipient.id, failureCode: null, failureMessage: null,
                    } });
                return { deliveryId, status: client_1.NotificationDeliveryStatus.DELIVERED, sent: true };
            }, { timeout: 15000 });
        }
        catch {
            await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.updateMany({
                where: { ...where, status: { in: [client_1.NotificationDeliveryStatus.PENDING, client_1.NotificationDeliveryStatus.RETRYING, client_1.NotificationDeliveryStatus.FAILED] } },
                data: { status: client_1.NotificationDeliveryStatus.FAILED, failureCode: 'IN_APP_DISPATCH_ERROR', failureMessage: 'ایجاد اعلان داخل سامانه ناموفق بود', attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
            }));
            this.logger.warn(`IN_APP dispatch failed deliveryId=${deliveryId} organizationId=${organizationId}`);
            return { deliveryId, status: client_1.NotificationDeliveryStatus.FAILED, sent: false, reason: 'IN_APP_DISPATCH_ERROR' };
        }
    }
};
exports.InAppNotificationChannelHandler = InAppNotificationChannelHandler;
exports.InAppNotificationChannelHandler = InAppNotificationChannelHandler = InAppNotificationChannelHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_template_engine_service_1.NotificationTemplateEngineService,
        notifications_service_1.NotificationsService, notification_action_url_resolver_1.NotificationActionUrlResolver,
        notification_action_url_resolver_1.InAppNotificationMetadataMapper])
], InAppNotificationChannelHandler);
//# sourceMappingURL=in-app-notification-channel.handler.js.map