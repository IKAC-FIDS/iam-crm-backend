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
exports.OperationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const timezone_boundary_util_1 = require("../common/dates/timezone-boundary.util");
const active_opportunity_scope_1 = require("../common/opportunities/active-opportunity-scope");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const operations_companies_query_dto_1 = require("./dto/operations-companies-query.dto");
const operations_attention_1 = require("./operations-attention");
const OPEN_TASK_STATUSES = [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS];
let OperationsService = class OperationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWorkspace(query, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const now = new Date();
        const recentLimit = query.recentLimit ?? 5;
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            const organization = await tx.organization.findUnique({
                where: { id: tenant.organizationId },
                select: { timezone: true },
            });
            const { start: todayStart, end: tomorrowStart } = (0, timezone_boundary_util_1.organizationDayBounds)(now, organization?.timezone || "Asia/Tehran");
            const taskWhere = {
                organizationId: tenant.organizationId,
                assignedToId: user.userId,
                status: { in: OPEN_TASK_STATUSES },
            };
            const meetingAccess = {
                OR: [
                    { organizerId: user.userId },
                    { assignees: { some: { userId: user.userId } } },
                ],
            };
            const [dueTodayTasks, overdueTasks, todayTasks, meetingsToday, activeOpportunities, unreadConversationMessages, recentParticipants, personalTodosToday, personalTodosUpcoming, personalTodosCompleted, personalTodosOverdue,] = await Promise.all([
                tx.task.count({
                    where: {
                        ...taskWhere,
                        dueAt: { gte: todayStart, lt: tomorrowStart },
                    },
                }),
                tx.task.count({
                    where: { ...taskWhere, dueAt: { lt: todayStart } },
                }),
                tx.task.findMany({
                    where: {
                        ...taskWhere,
                        dueAt: { gte: todayStart, lt: tomorrowStart },
                    },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        dueAt: true,
                        opportunityId: true,
                        company: {
                            select: { id: true, legalName: true, brandName: true },
                        },
                    },
                    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
                }),
                tx.meeting.findMany({
                    where: {
                        organizationId: tenant.organizationId,
                        status: client_1.MeetingStatus.SCHEDULED,
                        startAt: { gte: todayStart, lt: tomorrowStart },
                        ...meetingAccess,
                    },
                    select: {
                        id: true,
                        title: true,
                        startAt: true,
                        endAt: true,
                        mode: true,
                        company: {
                            select: { id: true, legalName: true, brandName: true },
                        },
                    },
                    orderBy: { startAt: "asc" },
                }),
                tx.opportunity.count({
                    where: {
                        AND: [
                            (0, active_opportunity_scope_1.activeOpportunityStateWhere)(),
                            {
                                organizationId: tenant.organizationId,
                                ownerId: user.userId,
                            },
                        ],
                    },
                }),
                this.getUnreadTotal(tx, tenant.organizationId, user.userId),
                tx.conversationParticipant.findMany({
                    where: {
                        userId: user.userId,
                        thread: { organizationId: tenant.organizationId },
                    },
                    select: {
                        threadId: true,
                        thread: {
                            select: {
                                entityType: true,
                                entityId: true,
                                status: true,
                                updatedAt: true,
                                messages: {
                                    where: { deletedAt: null },
                                    orderBy: { createdAt: "desc" },
                                    take: 1,
                                    select: {
                                        id: true,
                                        body: true,
                                        type: true,
                                        createdAt: true,
                                        author: {
                                            select: {
                                                id: true,
                                                fullName: true,
                                                avatarObjectKey: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { thread: { updatedAt: "desc" } },
                    take: recentLimit,
                }),
                tx.personalTodo.findMany({
                    where: {
                        organizationId: tenant.organizationId,
                        userId: user.userId,
                        status: client_1.PersonalTodoStatus.TODO,
                        OR: [{ dueAt: null }, { dueAt: { lt: tomorrowStart } }],
                    },
                    include: { company: { select: { id: true, legalName: true, brandName: true } }, opportunity: { select: { id: true, title: true } }, task: { select: { id: true, title: true } } },
                    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
                    take: recentLimit,
                }),
                tx.personalTodo.findMany({
                    where: { organizationId: tenant.organizationId, userId: user.userId, status: client_1.PersonalTodoStatus.TODO, dueAt: { gte: tomorrowStart } },
                    include: { company: { select: { id: true, legalName: true, brandName: true } }, opportunity: { select: { id: true, title: true } }, task: { select: { id: true, title: true } } },
                    orderBy: { dueAt: "asc" },
                    take: recentLimit,
                }),
                tx.personalTodo.findMany({
                    where: { organizationId: tenant.organizationId, userId: user.userId, status: client_1.PersonalTodoStatus.DONE },
                    include: { company: { select: { id: true, legalName: true, brandName: true } }, opportunity: { select: { id: true, title: true } }, task: { select: { id: true, title: true } } },
                    orderBy: { completedAt: "desc" },
                    take: recentLimit,
                }),
                tx.personalTodo.count({ where: { organizationId: tenant.organizationId, userId: user.userId, status: client_1.PersonalTodoStatus.TODO, dueAt: { lt: todayStart } } }),
            ]);
            const threadUnread = await this.getUnreadThreadCounts(tx, tenant.organizationId, user.userId, recentParticipants.map((participant) => participant.threadId));
            return {
                attention: {
                    dueTodayTasks,
                    overdueTasks,
                    unreadConversationMessages,
                    meetingsToday: meetingsToday.length,
                    activeOpportunities,
                },
                today: { tasks: todayTasks, meetings: meetingsToday },
                personalTodos: {
                    today: personalTodosToday,
                    upcoming: personalTodosUpcoming,
                    completed: personalTodosCompleted,
                    counts: { today: personalTodosToday.length, overdue: personalTodosOverdue, upcoming: personalTodosUpcoming.length },
                },
                recentConversations: recentParticipants.map((participant) => ({
                    threadId: participant.threadId,
                    entityType: participant.thread.entityType,
                    entityId: participant.thread.entityId,
                    status: participant.thread.status,
                    updatedAt: participant.thread.updatedAt,
                    unreadCount: threadUnread.get(participant.threadId) ?? 0,
                    latestMessage: participant.thread.messages[0] ?? null,
                })),
            };
        });
    }
    async getCompanies(query, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const now = new Date();
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            const organization = await tx.organization.findUnique({
                where: { id: tenant.organizationId },
                select: { timezone: true },
            });
            const { start: todayStart, end: tomorrowStart } = (0, timezone_boundary_util_1.organizationDayBounds)(now, organization?.timezone || "Asia/Tehran");
            const companyWhere = await this.buildCompanyWhere(tx, query, user, tenant.organizationId, todayStart, tomorrowStart, now);
            const [total, companies] = await Promise.all([
                tx.company.count({ where: companyWhere }),
                tx.company.findMany({
                    where: companyWhere,
                    select: {
                        id: true,
                        legalName: true,
                        brandName: true,
                        logoObjectKey: true,
                        priority: true,
                        activityStatus: true,
                        owner: {
                            select: { id: true, fullName: true, avatarObjectKey: true },
                        },
                    },
                    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
                    skip: (page - 1) * limit,
                    take: limit,
                }),
            ]);
            const companyIds = companies.map((company) => company.id);
            if (!companyIds.length) {
                return this.paginated([], total, page, limit);
            }
            const [opportunityCounts, opportunityItems, tasks, meetings, activities, conversationThreads, unreadCounts,] = await Promise.all([
                tx.opportunity.groupBy({
                    by: ["companyId"],
                    where: {
                        AND: [
                            (0, active_opportunity_scope_1.activeOpportunityStateWhere)(),
                            {
                                organizationId: tenant.organizationId,
                                companyId: { in: companyIds },
                            },
                        ],
                    },
                    _count: { id: true },
                }),
                tx.opportunity.findMany({
                    where: {
                        AND: [
                            (0, active_opportunity_scope_1.activeOpportunityStateWhere)(),
                            {
                                organizationId: tenant.organizationId,
                                companyId: { in: companyIds },
                            },
                        ],
                    },
                    select: {
                        id: true,
                        companyId: true,
                        title: true,
                        priority: true,
                        expectedCloseDate: true,
                        stage: {
                            select: { id: true, label: true, terminalType: true },
                        },
                    },
                    orderBy: { updatedAt: "desc" },
                }),
                tx.task.findMany({
                    where: {
                        organizationId: tenant.organizationId,
                        companyId: { in: companyIds },
                        assignedToId: user.userId,
                        status: { in: OPEN_TASK_STATUSES },
                    },
                    select: {
                        id: true,
                        companyId: true,
                        title: true,
                        dueAt: true,
                        priority: true,
                        opportunityId: true,
                    },
                    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
                }),
                tx.meeting.findMany({
                    where: {
                        organizationId: tenant.organizationId,
                        companyId: { in: companyIds },
                        status: client_1.MeetingStatus.SCHEDULED,
                        startAt: { gte: now },
                        OR: [
                            { organizerId: user.userId },
                            { assignees: { some: { userId: user.userId } } },
                        ],
                    },
                    select: {
                        id: true,
                        companyId: true,
                        title: true,
                        startAt: true,
                        mode: true,
                    },
                    orderBy: { startAt: "asc" },
                }),
                tx.activity.findMany({
                    where: {
                        companyId: { in: companyIds },
                        company: { organizationId: tenant.organizationId },
                        type: { not: "STAGE_CHANGE" },
                    },
                    select: { id: true, companyId: true, type: true, occurredAt: true },
                    orderBy: { occurredAt: "desc" },
                    distinct: ["companyId"],
                }),
                tx.conversationThread.findMany({
                    where: {
                        organizationId: tenant.organizationId,
                        entityType: client_1.ConversationEntityType.COMPANY,
                        entityId: { in: companyIds },
                    },
                    select: {
                        entityId: true,
                        messages: {
                            where: { deletedAt: null },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: {
                                id: true,
                                body: true,
                                type: true,
                                createdAt: true,
                                author: {
                                    select: {
                                        id: true,
                                        fullName: true,
                                        avatarObjectKey: true,
                                    },
                                },
                            },
                        },
                    },
                }),
                this.getUnreadCompanyCounts(tx, tenant.organizationId, user.userId, companyIds),
            ]);
            const opportunityCountMap = new Map(opportunityCounts.map((item) => [item.companyId, item._count.id]));
            const opportunityMap = this.groupByCompany(opportunityItems);
            const taskMap = this.groupByCompany(tasks);
            const meetingMap = this.groupByCompany(meetings);
            const activityMap = new Map(activities
                .filter((activity) => activity.companyId)
                .map((activity) => [activity.companyId, activity]));
            const conversationMap = new Map(conversationThreads.map((thread) => [thread.entityId, thread]));
            const data = companies.map((company) => {
                const companyTasks = taskMap.get(company.id) ?? [];
                const companyMeetings = meetingMap.get(company.id) ?? [];
                const activeCount = opportunityCountMap.get(company.id) ?? 0;
                const overdue = companyTasks.filter((task) => task.dueAt && task.dueAt < todayStart).length;
                const dueToday = companyTasks.filter((task) => task.dueAt &&
                    task.dueAt >= todayStart &&
                    task.dueAt < tomorrowStart).length;
                const futureTasks = companyTasks.filter((task) => task.dueAt && task.dueAt >= tomorrowStart);
                const nextTask = companyTasks
                    .filter((task) => task.dueAt && task.dueAt >= now)
                    .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime())[0];
                const nextMeeting = companyMeetings[0];
                const attention = (0, operations_attention_1.classifyOperationsAttention)({
                    overdueTasks: overdue,
                    dueTodayTasks: dueToday,
                    hasFutureTask: futureTasks.length > 0,
                    hasFutureMeeting: companyMeetings.length > 0,
                    activeOpportunities: activeCount,
                });
                const nextAction = this.nextAction(nextTask, nextMeeting);
                const thread = conversationMap.get(company.id);
                return {
                    company,
                    activeOpportunities: {
                        count: activeCount,
                        items: (opportunityMap.get(company.id) ?? []).slice(0, 3),
                    },
                    tasks: {
                        open: companyTasks.length,
                        overdue,
                        dueToday,
                        next: nextTask ?? null,
                    },
                    conversation: {
                        unreadCount: unreadCounts.get(company.id) ?? 0,
                        latestMessage: thread?.messages[0] ?? null,
                    },
                    lastActivity: activityMap.get(company.id) ?? null,
                    nextMeeting: nextMeeting ?? null,
                    nextAction,
                    attention,
                };
            });
            return this.paginated(data, total, page, limit);
        });
    }
    async buildCompanyWhere(tx, query, user, organizationId, todayStart, tomorrowStart, now) {
        const and = [
            { organizationId, archivedAt: null },
        ];
        if (query.search?.trim()) {
            const search = query.search.trim();
            and.push({
                OR: [
                    { legalName: { contains: search, mode: "insensitive" } },
                    { brandName: { contains: search, mode: "insensitive" } },
                    { nationalId: { contains: search } },
                ],
            });
        }
        if (query.priority)
            and.push({ priority: query.priority });
        const ownershipScope = query.ownershipScope ?? ownership_scope_dto_1.OwnershipScope.MINE;
        if (ownershipScope === ownership_scope_dto_1.OwnershipScope.MINE) {
            and.push({ ownerId: user.userId });
        }
        else if (ownershipScope === ownership_scope_dto_1.OwnershipScope.TEAM) {
            and.push({ owner: (0, team_scope_util_1.userTeamScopeWhere)(user) });
        }
        else if (ownershipScope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED) {
            and.push({ ownerId: null });
        }
        const openTask = {
            organizationId,
            assignedToId: user.userId,
            status: { in: OPEN_TASK_STATUSES },
        };
        const overdue = {
            tasks: { some: { ...openTask, dueAt: { lt: todayStart } } },
        };
        const today = {
            tasks: {
                some: {
                    ...openTask,
                    dueAt: { gte: todayStart, lt: tomorrowStart },
                },
            },
        };
        const futureTask = {
            tasks: { some: { ...openTask, dueAt: { gte: tomorrowStart } } },
        };
        const futureMeeting = {
            meetings: {
                some: {
                    organizationId,
                    status: client_1.MeetingStatus.SCHEDULED,
                    startAt: { gte: now },
                    OR: [
                        { organizerId: user.userId },
                        { assignees: { some: { userId: user.userId } } },
                    ],
                },
            },
        };
        const activeOpportunity = {
            opportunities: {
                some: { AND: [(0, active_opportunity_scope_1.activeOpportunityStateWhere)(), { organizationId }] },
            },
        };
        const noNextAction = {
            AND: [
                { NOT: overdue },
                { NOT: today },
                activeOpportunity,
                { NOT: futureTask },
                { NOT: futureMeeting },
            ],
        };
        if (query.hasActiveOpportunity !== undefined) {
            and.push(query.hasActiveOpportunity === "true"
                ? activeOpportunity
                : { NOT: activeOpportunity });
        }
        if (query.hasNoNextAction !== undefined) {
            and.push(query.hasNoNextAction === "true" ? noNextAction : { NOT: noNextAction });
        }
        if (query.attentionState) {
            and.push(this.attentionWhere(query.attentionState, overdue, today, futureTask, futureMeeting, activeOpportunity, noNextAction));
        }
        if (query.hasUnreadMessages !== undefined) {
            const unreadIds = Array.from((await this.getUnreadCompanyCounts(tx, organizationId, user.userId)).keys());
            if (query.hasUnreadMessages === "true") {
                and.push({ id: { in: unreadIds } });
            }
            else if (unreadIds.length) {
                and.push({ id: { notIn: unreadIds } });
            }
        }
        return { AND: and };
    }
    attentionWhere(state, overdue, today, futureTask, futureMeeting, activeOpportunity, noNextAction) {
        if (state === operations_companies_query_dto_1.OperationsAttentionState.OVERDUE)
            return overdue;
        if (state === operations_companies_query_dto_1.OperationsAttentionState.TODAY) {
            return { AND: [{ NOT: overdue }, today] };
        }
        if (state === operations_companies_query_dto_1.OperationsAttentionState.NO_NEXT_ACTION)
            return noNextAction;
        if (state === operations_companies_query_dto_1.OperationsAttentionState.UPCOMING) {
            return {
                AND: [
                    { NOT: overdue },
                    { NOT: today },
                    { OR: [futureTask, futureMeeting] },
                ],
            };
        }
        return {
            AND: [
                { NOT: overdue },
                { NOT: today },
                { NOT: futureTask },
                { NOT: futureMeeting },
                { NOT: activeOpportunity },
            ],
        };
    }
    nextAction(task, meeting) {
        if (!task?.dueAt && !meeting)
            return null;
        if (!meeting || (task?.dueAt && task.dueAt <= meeting.startAt)) {
            return {
                type: "TASK",
                id: task.id,
                title: task.title,
                at: task.dueAt,
            };
        }
        return {
            type: "MEETING",
            id: meeting.id,
            title: meeting.title,
            at: meeting.startAt,
        };
    }
    groupByCompany(items) {
        const grouped = new Map();
        for (const item of items) {
            if (!item.companyId)
                continue;
            const group = grouped.get(item.companyId) ?? [];
            group.push(item);
            grouped.set(item.companyId, group);
        }
        return grouped;
    }
    paginated(data, total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async getUnreadCompanyCounts(tx, organizationId, userId, companyIds) {
        if (companyIds && !companyIds.length)
            return new Map();
        const companyFilter = companyIds
            ? client_1.Prisma.sql `AND thread."entityId" IN (${client_1.Prisma.join(companyIds)})`
            : client_1.Prisma.empty;
        const rows = await tx.$queryRaw(client_1.Prisma.sql `
      SELECT thread."entityId" AS "companyId", COUNT(message.id)::int AS "unreadCount"
      FROM "conversation_threads" thread
      INNER JOIN "conversation_participants" participant
        ON participant."threadId" = thread.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message
        ON message."threadId" = thread.id
        AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId}
        AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE thread."organizationId" = ${organizationId}
        AND thread."entityType" = CAST(${client_1.ConversationEntityType.COMPANY} AS "ConversationEntityType")
        ${companyFilter}
      GROUP BY thread."entityId"
    `);
        return new Map(rows.map((row) => [row.companyId, Number(row.unreadCount)]));
    }
    async getUnreadThreadCounts(tx, organizationId, userId, threadIds) {
        if (!threadIds.length)
            return new Map();
        const rows = await tx.$queryRaw(client_1.Prisma.sql `
      SELECT thread.id AS "threadId", COUNT(message.id)::int AS "unreadCount"
      FROM "conversation_threads" thread
      INNER JOIN "conversation_participants" participant
        ON participant."threadId" = thread.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message
        ON message."threadId" = thread.id
        AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId}
        AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE thread."organizationId" = ${organizationId}
        AND thread.id IN (${client_1.Prisma.join(threadIds)})
      GROUP BY thread.id
    `);
        return new Map(rows.map((row) => [row.threadId, Number(row.unreadCount)]));
    }
    async getUnreadTotal(tx, organizationId, userId) {
        const rows = await tx.$queryRaw(client_1.Prisma.sql `
      SELECT COUNT(message.id)::int AS "unreadCount"
      FROM "conversation_threads" thread
      INNER JOIN "conversation_participants" participant
        ON participant."threadId" = thread.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message
        ON message."threadId" = thread.id
        AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId}
        AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE thread."organizationId" = ${organizationId}
    `);
        return Number(rows[0]?.unreadCount ?? 0);
    }
};
exports.OperationsService = OperationsService;
exports.OperationsService = OperationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OperationsService);
//# sourceMappingURL=operations.service.js.map