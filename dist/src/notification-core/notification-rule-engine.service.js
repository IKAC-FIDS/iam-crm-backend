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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRuleEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_template_engine_service_1 = require("./notification-template-engine.service");
const notification_policy_context_builder_service_1 = require("./policy/notification-policy-context-builder.service");
const notification_policy_evaluator_service_1 = require("./policy/notification-policy-evaluator.service");
const notification_delivery_service_1 = require("./deduplication/notification-delivery.service");
const notification_orchestration_service_1 = require("./orchestration/notification-orchestration.service");
let NotificationRuleEngineService = class NotificationRuleEngineService {
    constructor(prisma, templateEngine, contextBuilder, policyEvaluator, deliveries, orchestration) {
        this.prisma = prisma;
        this.templateEngine = templateEngine;
        this.contextBuilder = contextBuilder;
        this.policyEvaluator = policyEvaluator;
        this.deliveries = deliveries;
        this.orchestration = orchestration;
    }
    async evaluateEvent(event, db = this.prisma) {
        const rules = await db.notificationRule.findMany({
            where: {
                organizationId: event.organizationId,
                eventName: event.eventName,
                enabled: true,
            },
            include: {
                schedule: true,
                recipientRules: {
                    where: { enabled: true },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        });
        let created = 0;
        let duplicate = 0;
        let unresolved = 0;
        let matchedRules = 0;
        const needsPolicyContext = rules.some(rule => this.policyEvaluator.hasConditions(rule.conditions));
        const policyContext = needsPolicyContext ? await this.contextBuilder.build(event, db) : null;
        for (const rule of rules) {
            if (!this.scheduleMatches(rule.schedule, event))
                continue;
            if (policyContext && !this.policyEvaluator.evaluate(rule.conditions, policyContext).matches)
                continue;
            matchedRules += 1;
            for (const recipientRule of rule.recipientRules) {
                const recipientIds = await this.resolveRecipientIds(event, recipientRule, db);
                if (!recipientIds.length) {
                    unresolved += recipientRule.channels.length;
                    continue;
                }
                for (const recipientUserId of recipientIds) {
                    for (const channel of recipientRule.channels) {
                        try {
                            const rendered = await this.templateEngine.renderDelivery(event, recipientUserId, channel, db);
                            const decision = this.orchestration ? await this.orchestration.decide(event, rule, recipientUserId, channel, db) : undefined;
                            const result = await this.deliveries.createPendingDelivery({ event, ruleId: rule.id, recipientRuleId: recipientRule.id, recipientUserId, templateId: rendered.template.id, channel, priority: rule.deliveryPriority, decision }, db);
                            if (result.status === "CREATED")
                                created += 1;
                            else
                                duplicate += 1;
                        }
                        catch (error) {
                            if (error instanceof common_1.NotFoundException) {
                                unresolved += 1;
                                continue;
                            }
                            throw error;
                        }
                    }
                }
            }
        }
        return { rules: rules.length, matchedRules, created, duplicate, unresolved };
    }
    async resolveRecipientIds(event, rule, db) {
        switch (rule.type) {
            case client_1.NotificationRecipientType.USER:
                return this.activeUsers(event.organizationId, rule.targetId ? [rule.targetId] : [], db);
            case client_1.NotificationRecipientType.ROLE:
                return this.usersByRole(event.organizationId, rule.targetId, db);
            case client_1.NotificationRecipientType.TEAM:
                return this.usersByTeam(event.organizationId, rule.targetId, db);
            case client_1.NotificationRecipientType.ASSIGNEE:
                return this.aggregateAssignees(event, db);
            case client_1.NotificationRecipientType.CREATOR:
                return this.aggregateCreator(event, db);
            case client_1.NotificationRecipientType.OWNER:
                return this.payloadIds(event, "ownerUserId", db);
            case client_1.NotificationRecipientType.MANAGER:
                return this.aggregateManagers(event, db);
            default:
                return [];
        }
    }
    async usersByRole(organizationId, roleId, db) {
        if (!roleId)
            return [];
        const users = await db.user.findMany({
            where: {
                isActive: true,
                OR: [
                    { organizationId, roleId },
                    {
                        organizationMemberships: {
                            some: {
                                organizationId,
                                status: client_1.OrganizationMembershipStatus.ACTIVE,
                                roleId,
                            },
                        },
                    },
                ],
            },
            select: { id: true },
        });
        return this.unique(users.map((item) => item.id));
    }
    async usersByTeam(organizationId, teamId, db) {
        if (!teamId)
            return [];
        const users = await db.user.findMany({
            where: {
                isActive: true,
                OR: [
                    { organizationId, teamId },
                    {
                        organizationMemberships: {
                            some: {
                                organizationId,
                                status: client_1.OrganizationMembershipStatus.ACTIVE,
                                teamId,
                            },
                        },
                    },
                ],
            },
            select: { id: true },
        });
        return this.unique(users.map((item) => item.id));
    }
    async aggregateAssignees(event, db) {
        if (event.aggregateType === "MEETING") {
            const rows = await db.meetingAssignee.findMany({
                where: {
                    meetingId: event.aggregateId,
                    meeting: { organizationId: event.organizationId },
                },
                select: { userId: true },
            });
            return this.activeUsers(event.organizationId, rows.map((row) => row.userId), db);
        }
        if (event.aggregateType === "TASK") {
            const task = await db.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { assignedToId: true },
            });
            return this.activeUsers(event.organizationId, task?.assignedToId ? [task.assignedToId] : [], db);
        }
        return this.payloadIds(event, "assigneeUserIds", db);
    }
    async aggregateCreator(event, db) {
        if (event.aggregateType === "MEETING") {
            const meeting = await db.meeting.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { createdById: true },
            });
            return this.activeUsers(event.organizationId, meeting?.createdById ? [meeting.createdById] : [], db);
        }
        if (event.aggregateType === "TASK") {
            const task = await db.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { createdById: true },
            });
            return this.activeUsers(event.organizationId, task?.createdById ? [task.createdById] : [], db);
        }
        return this.payloadIds(event, "creatorUserId", db);
    }
    async aggregateManagers(event, db) {
        let teamIds = [];
        if (event.aggregateType === "TASK") {
            const task = await db.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { teamId: true, assignedTo: { select: { teamId: true } } },
            });
            teamIds = [task?.teamId, task?.assignedTo?.teamId].filter((value) => Boolean(value));
        }
        else if (event.aggregateType === "MEETING") {
            const rows = await db.meetingAssignee.findMany({
                where: {
                    meetingId: event.aggregateId,
                    meeting: { organizationId: event.organizationId },
                },
                select: { user: { select: { teamId: true } } },
            });
            teamIds = rows
                .map((row) => row.user.teamId)
                .filter((value) => Boolean(value));
        }
        if (!teamIds.length)
            return this.payloadIds(event, "managerUserIds", db);
        const teams = await db.team.findMany({
            where: {
                id: { in: this.unique(teamIds) },
                organizationId: event.organizationId,
                isActive: true,
            },
            select: { managerId: true },
        });
        return this.activeUsers(event.organizationId, teams
            .map((team) => team.managerId)
            .filter((value) => Boolean(value)), db);
    }
    async payloadIds(event, key, db) {
        const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
            ? event.payload
            : {};
        const value = payload[key];
        const ids = Array.isArray(value)
            ? value.filter((item) => typeof item === "string")
            : typeof value === "string"
                ? [value]
                : [];
        return this.activeUsers(event.organizationId, ids, db);
    }
    async activeUsers(organizationId, ids, db) {
        const uniqueIds = this.unique(ids);
        if (!uniqueIds.length)
            return [];
        const users = await db.user.findMany({
            where: { id: { in: uniqueIds }, organizationMemberships: { some: { organizationId, status: client_1.OrganizationMembershipStatus.ACTIVE } }, isActive: true },
            select: { id: true },
        });
        return users.map((user) => user.id);
    }
    unique(values) {
        return [...new Set(values)];
    }
    scheduleMatches(schedule, event) {
        const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {};
        const metadata = payload.schedule && typeof payload.schedule === "object" && !Array.isArray(payload.schedule) ? payload.schedule : null;
        if (!metadata)
            return schedule == null;
        return Boolean(schedule) && schedule?.offsetMinutes === metadata.offsetMinutes;
    }
};
exports.NotificationRuleEngineService = NotificationRuleEngineService;
exports.NotificationRuleEngineService = NotificationRuleEngineService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_template_engine_service_1.NotificationTemplateEngineService,
        notification_policy_context_builder_service_1.NotificationPolicyContextBuilder,
        notification_policy_evaluator_service_1.NotificationPolicyEvaluatorService,
        notification_delivery_service_1.NotificationDeliveryService,
        notification_orchestration_service_1.NotificationOrchestrationService])
], NotificationRuleEngineService);
//# sourceMappingURL=notification-rule-engine.service.js.map