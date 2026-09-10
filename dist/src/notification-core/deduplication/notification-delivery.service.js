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
var NotificationDeliveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notification_deduplication_key_service_1 = require("./notification-deduplication-key.service");
let NotificationDeliveryService = NotificationDeliveryService_1 = class NotificationDeliveryService {
    constructor(identities) {
        this.identities = identities;
        this.logger = new common_1.Logger(NotificationDeliveryService_1.name);
    }
    async createPendingDelivery(input, db) {
        const eventOccurrenceKey = this.identities.eventOccurrence(input.event);
        const deduplicationKey = this.identities.build({ organizationId: input.event.organizationId, eventOccurrenceKey, recipientUserId: input.recipientUserId, channel: input.channel });
        const data = {
            organizationId: input.event.organizationId,
            eventId: input.event.id,
            ruleId: input.ruleId ?? null,
            recipientRuleId: input.recipientRuleId ?? null,
            recipientUserId: input.recipientUserId,
            templateId: input.templateId ?? null,
            channel: input.channel,
            status: input.decision?.status ?? client_1.NotificationDeliveryStatus.PENDING,
            priority: input.priority,
            orchestrationReason: input.decision?.disposition ?? "DIRECT",
            nextAttemptAt: input.decision?.nextAttemptAt ?? null,
            deferredUntil: input.decision?.deferredUntil ?? null,
            escalationRunId: input.escalationRunId ?? null,
            deduplicationKey,
        };
        try {
            const inserted = await db.notificationDelivery.createMany({ data, skipDuplicates: true });
            const delivery = await db.notificationDelivery.findUniqueOrThrow({ where: { organizationId_deduplicationKey: { organizationId: input.event.organizationId, deduplicationKey } } });
            if (inserted.count === 1) {
                if (input.decision?.digest)
                    await this.attachDigest(input, delivery.id, db);
                this.log("delivery.created", input, delivery.id);
                return { status: "CREATED", delivery };
            }
            this.log("delivery.duplicate_skipped", input, delivery.id);
            return { status: "DUPLICATE", delivery };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                const delivery = await db.notificationDelivery.findUniqueOrThrow({ where: { organizationId_deduplicationKey: { organizationId: input.event.organizationId, deduplicationKey } } });
                this.log("delivery.unique_conflict", input, delivery.id);
                return { status: "DUPLICATE", delivery };
            }
            throw error;
        }
    }
    async attachDigest(input, deliveryId, db) {
        const digest = input.decision?.digest;
        if (!digest)
            return;
        const bucket = await db.notificationDigestBucket.upsert({
            where: { organizationId_policyId_recipientUserId_channel_windowStart: { organizationId: input.event.organizationId, policyId: digest.policyId, recipientUserId: input.recipientUserId, channel: input.channel, windowStart: digest.windowStart } },
            create: { organizationId: input.event.organizationId, policyId: digest.policyId, recipientUserId: input.recipientUserId, channel: input.channel, windowStart: digest.windowStart, scheduledFor: digest.scheduledFor, carrierDeliveryId: deliveryId },
            update: { scheduledFor: digest.scheduledFor },
            select: { id: true, carrierDeliveryId: true },
        });
        await db.notificationDigestItem.createMany({ data: [{ bucketId: bucket.id, deliveryId, eventId: input.event.id }], skipDuplicates: true });
        await db.notificationDelivery.update({ where: { id: deliveryId }, data: {
                digestBucketId: bucket.id,
                ...(bucket.carrierDeliveryId === deliveryId ? {} : { status: client_1.NotificationDeliveryStatus.SKIPPED, nextAttemptAt: null, deferredUntil: digest.scheduledFor, orchestrationReason: "DIGEST_ITEM" }),
            } });
    }
    log(event, input, deliveryId) {
        this.logger.log(JSON.stringify({ event, organizationId: input.event.organizationId, eventName: input.event.eventName, recipientUserId: input.recipientUserId, channel: input.channel, deliveryId }));
    }
};
exports.NotificationDeliveryService = NotificationDeliveryService;
exports.NotificationDeliveryService = NotificationDeliveryService = NotificationDeliveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_deduplication_key_service_1.NotificationDeduplicationKeyService])
], NotificationDeliveryService);
//# sourceMappingURL=notification-delivery.service.js.map