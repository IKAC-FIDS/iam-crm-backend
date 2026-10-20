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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryAuditService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
let NotificationDeliveryAuditService = class NotificationDeliveryAuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(deliveryId, organizationId, before, resultStatus) {
        return this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), async (tx) => {
            const delivery = await tx.notificationDelivery.findFirst({ where: { id: deliveryId, organizationId }, select: { id: true, channel: true, attemptCount: true, lastAttemptAt: true, providerMessageId: true, failureCode: true, failureMessage: true } });
            if (!delivery?.lastAttemptAt || delivery.attemptCount < 1)
                return null;
            const triggerType = this.triggerType(before);
            const triggeredByUserId = triggerType === client_1.NotificationTriggerType.MANUAL_RETRY ? before.retryRequestedById : triggerType === client_1.NotificationTriggerType.DOMAIN_EVENT ? before.event.actorId : null;
            await tx.notificationDeliveryAttempt.createMany({ skipDuplicates: true, data: { organizationId, deliveryId, attemptNumber: delivery.attemptCount, triggerType, triggeredByUserId, status: resultStatus, provider: delivery.channel, providerMessageId: delivery.providerMessageId, failureCategory: delivery.failureCode ? this.failureCategory(delivery.failureCode) : null, failureCode: delivery.failureCode, failureReason: this.sanitize(delivery.failureMessage), startedAt: delivery.lastAttemptAt, finishedAt: new Date() } });
            await tx.notificationDelivery.updateMany({ where: { id: deliveryId, organizationId, retryRequestedById: before.retryRequestedById }, data: { retryRequestedAt: null, retryRequestedById: null } });
            return delivery.attemptCount;
        });
    }
    triggerType(value) {
        if (value.retryRequestedById)
            return client_1.NotificationTriggerType.MANUAL_RETRY;
        if (value.status === "RETRYING" || value.attemptCount > 0)
            return client_1.NotificationTriggerType.AUTOMATIC_RETRY;
        const payload = value.event.payload && typeof value.event.payload === "object" && !Array.isArray(value.event.payload) ? value.event.payload : {};
        if (payload.schedule)
            return client_1.NotificationTriggerType.SCHEDULED;
        if (value.event.actorId)
            return client_1.NotificationTriggerType.DOMAIN_EVENT;
        return client_1.NotificationTriggerType.SYSTEM;
    }
    failureCategory(code) {
        const value = code.toUpperCase();
        if (value.includes("TIMEOUT"))
            return client_1.NotificationFailureCategory.TIMEOUT;
        if (value.includes("AUTH") || value.includes("401") || value.includes("403"))
            return client_1.NotificationFailureCategory.AUTHENTICATION;
        if (value.includes("RATE") || value.includes("429"))
            return client_1.NotificationFailureCategory.RATE_LIMIT;
        if (value.includes("DESTINATION") || value.includes("RECIPIENT") || value.includes("ENDPOINT"))
            return client_1.NotificationFailureCategory.INVALID_DESTINATION;
        if (value.includes("TEMPLATE"))
            return client_1.NotificationFailureCategory.TEMPLATE_ERROR;
        if (value.includes("CONFIG") || value.includes("NOT_CONFIGURED"))
            return client_1.NotificationFailureCategory.CONFIGURATION;
        if (value.includes("NETWORK") || value.includes("DISPATCH") || /^HTTP_5/.test(value))
            return client_1.NotificationFailureCategory.NETWORK;
        if (value.includes("PROVIDER") || value.startsWith("HTTP_4"))
            return client_1.NotificationFailureCategory.PROVIDER_REJECTED;
        return client_1.NotificationFailureCategory.UNKNOWN;
    }
    sanitize(value) {
        if (!value)
            return null;
        return value.slice(0, 1000).replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").replace(/(api[-_ ]?key|password|token|secret)\s*[=:]\s*[^\s,;]+/gi, "$1=[REDACTED]").replace(/([?&](?:key|token|secret|signature)=)[^&\s]+/gi, "$1[REDACTED]");
    }
};
exports.NotificationDeliveryAuditService = NotificationDeliveryAuditService;
exports.NotificationDeliveryAuditService = NotificationDeliveryAuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationDeliveryAuditService);
//# sourceMappingURL=notification-delivery-audit.service.js.map