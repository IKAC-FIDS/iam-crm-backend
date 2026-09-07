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
var NotificationCoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCoreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_delivery_dispatcher_service_1 = require("./notification-delivery-dispatcher.service");
const notification_tenant_context_1 = require("./in-app/notification-tenant-context");
const notification_rule_engine_service_1 = require("./notification-rule-engine.service");
let NotificationCoreService = NotificationCoreService_1 = class NotificationCoreService {
    constructor(prisma, ruleEngine, dispatcher) {
        this.prisma = prisma;
        this.ruleEngine = ruleEngine;
        this.dispatcher = dispatcher;
        this.logger = new common_1.Logger(NotificationCoreService_1.name);
    }
    async publish(input, db = this.prisma) {
        const data = {
            organizationId: input.organizationId, eventName: input.eventName,
            aggregateType: input.aggregateType, aggregateId: input.aggregateId,
            actorId: input.actorId ?? null, payload: (input.payload ?? {}),
            idempotencyKey: input.idempotencyKey ?? null, occurredAt: input.occurredAt ?? new Date(),
        };
        if (!input.idempotencyKey)
            return db.notificationEvent.create({ data });
        await db.notificationEvent.createMany({ data, skipDuplicates: true });
        return db.notificationEvent.findFirstOrThrow({ where: {
                organizationId: input.organizationId, idempotencyKey: input.idempotencyKey,
            } });
    }
    async publishAndEvaluate(input) {
        const context = (0, notification_tenant_context_1.notificationTenantContext)(input.organizationId, input.actorId ?? undefined);
        const event = await this.prisma.withTenantTransaction(context, tx => this.publish(input, tx));
        const evaluation = await this.prisma.withTenantTransaction(context, tx => this.ruleEngine.evaluateEvent(event, tx));
        const pending = await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.findMany({
            where: { eventId: event.id, event: { organizationId: input.organizationId }, channel: { in: ['IN_APP', 'EMAIL', 'SMS'] }, status: { in: ['PENDING', 'RETRYING'] } }, select: { id: true },
        }));
        for (const delivery of pending)
            await this.dispatcher.dispatch(delivery.id, input.organizationId);
        return { event, evaluation };
    }
    async publishDomainEvent(input) {
        try {
            return await this.publishAndEvaluate(input);
        }
        catch (error) {
            const detail = error instanceof Error ? error.stack ?? error.message : String(error);
            this.logger.error(`Notification event processing failed event=${input.eventName} aggregateId=${input.aggregateId} organizationId=${input.organizationId}`, detail);
            return null;
        }
    }
};
exports.NotificationCoreService = NotificationCoreService;
exports.NotificationCoreService = NotificationCoreService = NotificationCoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_rule_engine_service_1.NotificationRuleEngineService,
        notification_delivery_dispatcher_service_1.NotificationDeliveryDispatcher])
], NotificationCoreService);
//# sourceMappingURL=notification-core.service.js.map