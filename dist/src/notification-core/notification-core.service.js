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
exports.NotificationCoreService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_rule_engine_service_1 = require("./notification-rule-engine.service");
let NotificationCoreService = class NotificationCoreService {
    constructor(prisma, ruleEngine) {
        this.prisma = prisma;
        this.ruleEngine = ruleEngine;
    }
    async publish(input) {
        const create = () => this.prisma.notificationEvent.create({
            data: {
                organizationId: input.organizationId,
                eventName: input.eventName,
                aggregateType: input.aggregateType,
                aggregateId: input.aggregateId,
                actorId: input.actorId ?? null,
                payload: (input.payload ?? {}),
                idempotencyKey: input.idempotencyKey ?? null,
                occurredAt: input.occurredAt ?? new Date(),
            },
        });
        if (!input.idempotencyKey) {
            return create();
        }
        const existing = await this.prisma.notificationEvent.findFirst({
            where: {
                organizationId: input.organizationId,
                idempotencyKey: input.idempotencyKey,
            },
        });
        if (existing)
            return existing;
        try {
            return await create();
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002") {
                const raced = await this.prisma.notificationEvent.findFirst({
                    where: {
                        organizationId: input.organizationId,
                        idempotencyKey: input.idempotencyKey,
                    },
                });
                if (raced)
                    return raced;
            }
            throw error;
        }
    }
    async publishAndEvaluate(input) {
        const event = await this.publish(input);
        const evaluation = await this.ruleEngine.evaluateEvent(event);
        return { event, evaluation };
    }
};
exports.NotificationCoreService = NotificationCoreService;
exports.NotificationCoreService = NotificationCoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_rule_engine_service_1.NotificationRuleEngineService])
], NotificationCoreService);
//# sourceMappingURL=notification-core.service.js.map