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
exports.NotificationRuleEngineService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationRuleEngineService = class NotificationRuleEngineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async evaluateEvent(event) {
        const rules = await this.prisma.notificationRule.findMany({
            where: {
                organizationId: event.organizationId,
                eventName: event.eventName,
                enabled: true,
            },
            include: {
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
        for (const rule of rules) {
            for (const recipientRule of rule.recipientRules) {
                const recipientIds = await this.resolveRecipientIds(event, recipientRule);
                if (!recipientIds.length) {
                    unresolved += recipientRule.channels.length;
                    continue;
                }
                for (const recipientUserId of recipientIds) {
                    for (const channel of recipientRule.channels) {
                        const deduplicationKey = [
                            event.id,
                            rule.id,
                            recipientRule.id,
                            recipientUserId,
                            channel,
                        ].join(":");
                        try {
                            await this.prisma.notificationDelivery.create({
                                data: {
                                    eventId: event.id,
                                    ruleId: rule.id,
                                    recipientRuleId: recipientRule.id,
                                    recipientUserId,
                                    channel,
                                    status: client_1.NotificationDeliveryStatus.PENDING,
                                    deduplicationKey,
                                },
                            });
                            created += 1;
                        }
                        catch (error) {
                            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                                error.code === "P2002") {
                                duplicate += 1;
                                continue;
                            }
                            throw error;
                        }
                    }
                }
            }
        }
        return { rules: rules.length, created, duplicate, unresolved };
    }
    async resolveRecipientIds(event, rule) {
        switch (rule.type) {
            case client_1.NotificationRecipientType.USER:
                return this.activeUsers(event.organizationId, rule.targetId ? [rule.targetId] : []);
            case client_1.NotificationRecipientType.ROLE:
                return this.usersByRole(event.organizationId, rule.targetId);
            case client_1.NotificationRecipientType.TEAM:
                return this.usersByTeam(event.organizationId, rule.targetId);
            case client_1.NotificationRecipientType.ASSIGNEE:
                return this.aggregateAssignees(event);
            case client_1.NotificationRecipientType.CREATOR:
                return this.aggregateCreator(event);
            case client_1.NotificationRecipientType.OWNER:
                return this.payloadIds(event, "ownerUserId");
            case client_1.NotificationRecipientType.MANAGER:
                return this.aggregateManagers(event);
            default:
                return [];
        }
    }
    async usersByRole(organizationId, roleId) {
        if (!roleId)
            return [];
        const users = await this.prisma.user.findMany({
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
    async usersByTeam(organizationId, teamId) {
        if (!teamId)
            return [];
        const users = await this.prisma.user.findMany({
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
    async aggregateAssignees(event) {
        if (event.aggregateType === "MEETING") {
            const rows = await this.prisma.meetingAssignee.findMany({
                where: {
                    meetingId: event.aggregateId,
                    meeting: { organizationId: event.organizationId },
                },
                select: { userId: true },
            });
            return this.activeUsers(event.organizationId, rows.map((row) => row.userId));
        }
        if (event.aggregateType === "TASK") {
            const task = await this.prisma.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { assignedToId: true },
            });
            return this.activeUsers(event.organizationId, task?.assignedToId ? [task.assignedToId] : []);
        }
        return this.payloadIds(event, "assigneeUserIds");
    }
    async aggregateCreator(event) {
        if (event.aggregateType === "MEETING") {
            const meeting = await this.prisma.meeting.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { createdById: true },
            });
            return this.activeUsers(event.organizationId, meeting?.createdById ? [meeting.createdById] : []);
        }
        if (event.aggregateType === "TASK") {
            const task = await this.prisma.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { createdById: true },
            });
            return this.activeUsers(event.organizationId, task?.createdById ? [task.createdById] : []);
        }
        return this.payloadIds(event, "creatorUserId");
    }
    async aggregateManagers(event) {
        let teamIds = [];
        if (event.aggregateType === "TASK") {
            const task = await this.prisma.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { teamId: true, assignedTo: { select: { teamId: true } } },
            });
            teamIds = [task?.teamId, task?.assignedTo?.teamId].filter((value) => Boolean(value));
        }
        else if (event.aggregateType === "MEETING") {
            const rows = await this.prisma.meetingAssignee.findMany({
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
            return this.payloadIds(event, "managerUserIds");
        const teams = await this.prisma.team.findMany({
            where: {
                id: { in: this.unique(teamIds) },
                organizationId: event.organizationId,
                isActive: true,
            },
            select: { managerId: true },
        });
        return this.activeUsers(event.organizationId, teams
            .map((team) => team.managerId)
            .filter((value) => Boolean(value)));
    }
    async payloadIds(event, key) {
        const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
            ? event.payload
            : {};
        const value = payload[key];
        const ids = Array.isArray(value)
            ? value.filter((item) => typeof item === "string")
            : typeof value === "string"
                ? [value]
                : [];
        return this.activeUsers(event.organizationId, ids);
    }
    async activeUsers(organizationId, ids) {
        const uniqueIds = this.unique(ids);
        if (!uniqueIds.length)
            return [];
        const users = await this.prisma.user.findMany({
            where: { id: { in: uniqueIds }, organizationId, isActive: true },
            select: { id: true },
        });
        return users.map((user) => user.id);
    }
    unique(values) {
        return [...new Set(values)];
    }
};
exports.NotificationRuleEngineService = NotificationRuleEngineService;
exports.NotificationRuleEngineService = NotificationRuleEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationRuleEngineService);
//# sourceMappingURL=notification-rule-engine.service.js.map