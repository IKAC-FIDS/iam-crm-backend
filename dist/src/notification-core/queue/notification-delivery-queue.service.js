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
exports.NotificationDeliveryQueueService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
let NotificationDeliveryQueueService = class NotificationDeliveryQueueService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    maxAttempts() { return this.integer("NOTIFICATION_RETRY_MAX_ATTEMPTS", 5, 1, 20); }
    batchSize() { return this.integer("NOTIFICATION_WORKER_BATCH_SIZE", 50, 1, 500); }
    leaseMs() { return this.integer("NOTIFICATION_PROCESSING_LEASE_SECONDS", 300, 30, 3600) * 1000; }
    retryDelayMs(attemptCount) {
        const base = this.integer("NOTIFICATION_RETRY_BASE_DELAY_SECONDS", 30, 1, 3600) * 1000;
        const maximum = this.integer("NOTIFICATION_RETRY_MAX_DELAY_SECONDS", 3600, 1, 86400) * 1000;
        return Math.min(maximum, base * 2 ** Math.max(0, attemptCount - 1));
    }
    async due(organizationId, now = new Date()) {
        return this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.notificationDelivery.findMany({
            where: { event: { organizationId }, status: { in: [client_1.NotificationDeliveryStatus.PENDING, client_1.NotificationDeliveryStatus.RETRYING] }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
            select: { id: true }, orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }], take: this.batchSize(),
        }));
    }
    async recoverStale(organizationId, now = new Date()) {
        const expiredBefore = new Date(now.getTime() - this.leaseMs());
        return this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.notificationDelivery.updateMany({
            where: { event: { organizationId }, status: client_1.NotificationDeliveryStatus.PROCESSING, processingStartedAt: { lte: expiredBefore } },
            data: { status: client_1.NotificationDeliveryStatus.RETRYING, nextAttemptAt: now, processingStartedAt: null, failureCode: "PROCESSING_LEASE_EXPIRED", failureMessage: "پردازش قبلی کامل نشد و برای تلاش مجدد بازیابی شد" },
        }));
    }
    async handleFailure(deliveryId, organizationId, reason) {
        return this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), async (tx) => {
            const delivery = await tx.notificationDelivery.findFirst({ where: { id: deliveryId, event: { organizationId }, status: { in: [client_1.NotificationDeliveryStatus.FAILED, client_1.NotificationDeliveryStatus.PROCESSING] } }, select: { id: true, attemptCount: true, failureMessage: true } });
            if (!delivery)
                return null;
            const exhausted = delivery.attemptCount >= this.maxAttempts();
            return tx.notificationDelivery.update({ where: { id: delivery.id }, data: {
                    status: exhausted ? client_1.NotificationDeliveryStatus.FAILED : client_1.NotificationDeliveryStatus.RETRYING,
                    nextAttemptAt: exhausted ? null : new Date(Date.now() + this.retryDelayMs(delivery.attemptCount)),
                    processingStartedAt: null,
                    failureCode: exhausted ? "RETRY_EXHAUSTED" : reason || "DELIVERY_RETRY_SCHEDULED",
                    failureMessage: delivery.failureMessage || reason || "ارسال اعلان موقتاً ناموفق بود",
                } });
        });
    }
    async retryNow(deliveryId, organizationId) {
        return this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), async (tx) => {
            const delivery = await tx.notificationDelivery.findFirst({ where: { id: deliveryId, event: { organizationId } }, select: { id: true, status: true } });
            if (!delivery)
                throw new common_1.BadRequestException("Delivery در سازمان جاری یافت نشد");
            const terminal = new Set([client_1.NotificationDeliveryStatus.SENT, client_1.NotificationDeliveryStatus.DELIVERED, client_1.NotificationDeliveryStatus.SKIPPED, client_1.NotificationDeliveryStatus.PROCESSING]);
            if (terminal.has(delivery.status))
                throw new common_1.BadRequestException("این ارسال در وضعیت قابل تلاش مجدد نیست");
            return tx.notificationDelivery.update({ where: { id: delivery.id }, data: { status: client_1.NotificationDeliveryStatus.RETRYING, attemptCount: 0, nextAttemptAt: new Date(), processingStartedAt: null, failureCode: null, failureMessage: null } });
        });
    }
    integer(name, fallback, minimum, maximum) {
        const value = Number(process.env[name] ?? fallback);
        return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback;
    }
};
exports.NotificationDeliveryQueueService = NotificationDeliveryQueueService;
exports.NotificationDeliveryQueueService = NotificationDeliveryQueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationDeliveryQueueService);
//# sourceMappingURL=notification-delivery-queue.service.js.map