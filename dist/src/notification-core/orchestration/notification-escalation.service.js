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
var NotificationEscalationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEscalationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
const notification_delivery_service_1 = require("../deduplication/notification-delivery.service");
const notification_rule_engine_service_1 = require("../notification-rule-engine.service");
const notification_template_engine_service_1 = require("../notification-template-engine.service");
const notification_policy_context_builder_service_1 = require("../policy/notification-policy-context-builder.service");
const notification_policy_evaluator_service_1 = require("../policy/notification-policy-evaluator.service");
const notification_orchestration_service_1 = require("./notification-orchestration.service");
let NotificationEscalationService = NotificationEscalationService_1 = class NotificationEscalationService {
    constructor(prisma, rules, templates, deliveries, contextBuilder, evaluator, orchestration) {
        this.prisma = prisma;
        this.rules = rules;
        this.templates = templates;
        this.deliveries = deliveries;
        this.contextBuilder = contextBuilder;
        this.evaluator = evaluator;
        this.orchestration = orchestration;
        this.logger = new common_1.Logger(NotificationEscalationService_1.name);
    }
    async register(event, db) {
        const policies = await db.notificationEscalationPolicy.findMany({ where: { organizationId: event.organizationId, enabled: true, eventName: event.eventName, aggregateType: event.aggregateType }, include: { steps: true } });
        const context = policies.some(policy => this.evaluator.hasConditions(policy.conditions)) ? await this.contextBuilder.build(event, db) : null;
        const sourceDueAt = await this.sourceDueAt(event, db);
        for (const policy of policies) {
            if (context && !this.evaluator.evaluate(policy.conditions, context).matches)
                continue;
            for (const step of policy.steps)
                await db.notificationEscalationRun.createMany({ data: [{ organizationId: event.organizationId, policyId: policy.id, stepId: step.id, sourceEventId: event.id, aggregateType: event.aggregateType, aggregateId: event.aggregateId, sourceDueAt, scheduledFor: new Date(event.occurredAt.getTime() + step.delayMinutes * 60_000) }], skipDuplicates: true });
        }
    }
    async processOrganization(organizationId, now = new Date()) {
        const context = (0, notification_tenant_context_1.notificationTenantContext)(organizationId);
        const runs = await this.prisma.withTenantTransaction(context, tx => tx.notificationEscalationRun.findMany({ where: { organizationId, status: client_1.NotificationEscalationRunStatus.PENDING, scheduledFor: { lte: now } }, include: { policy: true, step: true }, orderBy: { scheduledFor: "asc" }, take: 100 }));
        let sent = 0, resolved = 0;
        for (const run of runs) {
            try {
                const claim = await this.prisma.withTenantTransaction(context, tx => tx.notificationEscalationRun.updateMany({ where: { id: run.id, organizationId, status: client_1.NotificationEscalationRunStatus.PENDING }, data: { status: client_1.NotificationEscalationRunStatus.PROCESSING } }));
                if (!claim.count)
                    continue;
                if (!(await this.isStillActionable(run.aggregateType, run.aggregateId, run.sourceDueAt, organizationId))) {
                    await this.prisma.withTenantTransaction(context, tx => tx.notificationEscalationRun.update({ where: { id: run.id }, data: { status: client_1.NotificationEscalationRunStatus.CANCELLED_RESOLVED, resolvedAt: now } }));
                    resolved += 1;
                    continue;
                }
                await this.prisma.withTenantTransaction(context, async (tx) => {
                    const source = await tx.notificationEvent.findFirstOrThrow({ where: { id: run.sourceEventId, organizationId } });
                    const event = await tx.notificationEvent.create({ data: { organizationId, eventName: source.eventName, aggregateType: source.aggregateType, aggregateId: source.aggregateId, actorId: null, occurredAt: now, idempotencyKey: `ESCALATION:${run.id}`, payload: { escalation: { runId: run.id, step: run.step.stepOrder, sourceEventId: source.id } } } });
                    const recipientIds = await this.rules.resolveRecipientIds(event, { type: run.step.recipientType, targetId: run.step.targetId }, tx);
                    for (const recipientUserId of recipientIds)
                        for (const channel of run.step.channels) {
                            const rendered = await this.templates.renderDelivery(event, recipientUserId, channel, tx);
                            const priority = run.step.priority ?? client_1.NotificationPriority.HIGH;
                            const decision = await this.orchestration.decide(event, { mandatory: run.step.mandatory, deliveryPriority: priority, digestPolicyId: null }, recipientUserId, channel, tx, now);
                            await this.deliveries.createPendingDelivery({ event, recipientUserId, templateId: rendered.template.id, channel, priority, escalationRunId: run.id, decision }, tx);
                        }
                    await tx.notificationEscalationRun.update({ where: { id: run.id }, data: { status: client_1.NotificationEscalationRunStatus.SENT } });
                });
                sent += 1;
            }
            catch (error) {
                await this.prisma.withTenantTransaction(context, tx => tx.notificationEscalationRun.updateMany({ where: { id: run.id, organizationId }, data: { status: client_1.NotificationEscalationRunStatus.FAILED } }));
                this.logger.error(JSON.stringify({ event: "notification.escalation.failed", organizationId, runId: run.id, category: error instanceof Error ? error.name : "UNKNOWN" }));
            }
        }
        return { candidates: runs.length, sent, resolved };
    }
    async sourceDueAt(event, db) { if (event.aggregateType !== "TASK")
        return null; const task = await db.task.findFirst({ where: { id: event.aggregateId, organizationId: event.organizationId }, select: { dueAt: true } }); return task?.dueAt ?? null; }
    async isStillActionable(type, id, dueAt, organizationId) { if (type !== "TASK")
        return true; const task = await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.task.findFirst({ where: { id, organizationId }, select: { status: true, dueAt: true } })); return Boolean(task && (task.status === client_1.TaskStatus.TODO || task.status === client_1.TaskStatus.IN_PROGRESS) && (!dueAt || task.dueAt?.getTime() === dueAt.getTime())); }
};
exports.NotificationEscalationService = NotificationEscalationService;
exports.NotificationEscalationService = NotificationEscalationService = NotificationEscalationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_rule_engine_service_1.NotificationRuleEngineService, notification_template_engine_service_1.NotificationTemplateEngineService, notification_delivery_service_1.NotificationDeliveryService, notification_policy_context_builder_service_1.NotificationPolicyContextBuilder, notification_policy_evaluator_service_1.NotificationPolicyEvaluatorService, notification_orchestration_service_1.NotificationOrchestrationService])
], NotificationEscalationService);
//# sourceMappingURL=notification-escalation.service.js.map