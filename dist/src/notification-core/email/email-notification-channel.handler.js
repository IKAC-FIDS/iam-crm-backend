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
var EmailNotificationChannelHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationChannelHandler = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const email_service_1 = require("../../email/email.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_template_engine_service_1 = require("../notification-template-engine.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
const notification_digest_renderer_service_1 = require("../orchestration/notification-digest-renderer.service");
let EmailNotificationChannelHandler = EmailNotificationChannelHandler_1 = class EmailNotificationChannelHandler {
    constructor(prisma, templates, email, digests) {
        this.prisma = prisma;
        this.templates = templates;
        this.email = email;
        this.digests = digests;
        this.channel = client_1.NotificationChannel.EMAIL;
        this.logger = new common_1.Logger(EmailNotificationChannelHandler_1.name);
    }
    async dispatch(deliveryId, organizationId) {
        if (!organizationId)
            throw new common_1.BadRequestException("Organization context is required");
        const context = (0, notification_tenant_context_1.notificationTenantContext)(organizationId);
        const where = { id: deliveryId, channel: this.channel, event: { organizationId } };
        const prepared = await this.prisma.withTenantTransaction(context, async (tx) => {
            const claim = await tx.notificationDelivery.updateMany({
                where: { ...where, status: { in: [client_1.NotificationDeliveryStatus.PENDING, client_1.NotificationDeliveryStatus.RETRYING, client_1.NotificationDeliveryStatus.FAILED] } },
                data: { status: client_1.NotificationDeliveryStatus.PROCESSING, attemptCount: { increment: 1 }, lastAttemptAt: new Date(), processingStartedAt: new Date(), nextAttemptAt: null },
            });
            const delivery = await tx.notificationDelivery.findFirst({
                where,
                include: {
                    event: true,
                    template: true,
                    recipientUser: { select: { id: true, email: true, isActive: true } },
                },
            });
            if (!delivery)
                throw new common_1.NotFoundException("Notification delivery not found");
            if (!claim.count)
                return { delivery, rendered: null, destination: null, claimable: false };
            if (delivery.digestBucketId)
                await tx.notificationDigestBucket.update({ where: { id: delivery.digestBucketId }, data: { status: "PROCESSING" } });
            const destination = delivery.destination?.trim().toLowerCase() || delivery.recipientUser?.email?.trim().toLowerCase() || null;
            if (!delivery.recipientUser?.isActive || !destination || !this.validEmail(destination) || !delivery.template) {
                return { delivery, rendered: null, destination, claimable: true };
            }
            const rendered = delivery.digestBucketId
                ? await this.digests.render(delivery.digestBucketId, delivery.recipientUser.id, tx)
                : await this.templates.renderStoredTemplate(delivery.event, delivery.recipientUser.id, delivery.template, tx);
            return { delivery, rendered, destination, claimable: true };
        });
        if (!prepared.claimable) {
            return { deliveryId, status: prepared.delivery.status, sent: false, reason: "DELIVERY_NOT_CLAIMABLE" };
        }
        if (!prepared.destination)
            return this.skip(deliveryId, organizationId, "MISSING_EMAIL_DESTINATION", "ایمیل معتبر برای گیرنده یافت نشد");
        if (!prepared.rendered || !prepared.rendered.subject?.trim())
            return this.skip(deliveryId, organizationId, "INVALID_EMAIL_TEMPLATE", "موضوع یا قالب ایمیل معتبر نیست");
        try {
            const result = await this.email.send(organizationId, {
                to: prepared.destination,
                subject: prepared.rendered.subject,
                text: prepared.rendered.body,
            });
            const now = new Date();
            await this.prisma.withTenantTransaction(context, (tx) => tx.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.NotificationDeliveryStatus.SENT,
                    destination: prepared.destination,
                    providerMessageId: result.messageId ?? null,
                    sentAt: now,
                    failureCode: null,
                    failureMessage: null,
                    processingStartedAt: null,
                },
            }));
            if (prepared.delivery.digestBucketId)
                await this.prisma.withTenantTransaction(context, tx => tx.notificationDigestBucket.update({ where: { id: prepared.delivery.digestBucketId }, data: { status: "SENT" } }));
            return { deliveryId, status: client_1.NotificationDeliveryStatus.SENT, sent: true };
        }
        catch (error) {
            const message = error instanceof Error ? error.message.slice(0, 1000) : "ارسال ایمیل ناموفق بود";
            await this.prisma.withTenantTransaction(context, (tx) => tx.notificationDelivery.update({
                where: { id: deliveryId },
                data: { status: client_1.NotificationDeliveryStatus.FAILED, destination: prepared.destination, failureCode: "EMAIL_DISPATCH_ERROR", failureMessage: message, processingStartedAt: null },
            }));
            if (prepared.delivery.digestBucketId)
                await this.prisma.withTenantTransaction(context, tx => tx.notificationDigestBucket.update({ where: { id: prepared.delivery.digestBucketId }, data: { status: "FAILED" } }));
            this.logger.warn(`EMAIL dispatch failed deliveryId=${deliveryId} organizationId=${organizationId}`);
            return { deliveryId, status: client_1.NotificationDeliveryStatus.FAILED, sent: false, reason: "EMAIL_DISPATCH_ERROR" };
        }
    }
    async skip(deliveryId, organizationId, code, message) {
        await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), (tx) => tx.notificationDelivery.update({
            where: { id: deliveryId },
            data: { status: client_1.NotificationDeliveryStatus.SKIPPED, failureCode: code, failureMessage: message, processingStartedAt: null, nextAttemptAt: null },
        }));
        return { deliveryId, status: client_1.NotificationDeliveryStatus.SKIPPED, sent: false, reason: code };
    }
    validEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
};
exports.EmailNotificationChannelHandler = EmailNotificationChannelHandler;
exports.EmailNotificationChannelHandler = EmailNotificationChannelHandler = EmailNotificationChannelHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_template_engine_service_1.NotificationTemplateEngineService,
        email_service_1.EmailService,
        notification_digest_renderer_service_1.NotificationDigestRendererService])
], EmailNotificationChannelHandler);
//# sourceMappingURL=email-notification-channel.handler.js.map