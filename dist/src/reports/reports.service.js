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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const activity_type_1 = require("../activities/activity-type");
const prisma_service_1 = require("../prisma/prisma.service");
const api_date_util_1 = require("../common/dates/api-date.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const financial_visibility_1 = require("../common/financial/financial-visibility");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    transitionKey(fromStageId, toStageId) {
        return `${fromStageId ?? 'ENTRY'}:${toStageId}`;
    }
    percent(part, total) {
        return total ? Math.round((part / total) * 100) : 0;
    }
    companyWhere(filters, user) {
        const and = [
            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
        ];
        if (filters.ownerIds?.length)
            and.push({ ownerId: { in: filters.ownerIds } });
        if (filters.teams?.length)
            and.push({ owner: (0, team_scope_util_1.userTeamFilterWhere)(filters.teams) });
        if (filters.priorities?.length)
            and.push({ priority: { in: filters.priorities } });
        if (filters.industries?.length)
            and.push({ industry: { in: filters.industries } });
        if (filters.sources?.length)
            and.push({ source: { in: filters.sources } });
        if (filters.companyIds?.length)
            and.push({ id: { in: filters.companyIds } });
        and.push(this.companyOwnershipScopeWhere(filters.ownershipScope, user));
        return and.length ? { AND: and } : {};
    }
    opportunityWhere(filters, user, applyCreatedAt = false) {
        const and = [
            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            { archivedAt: null },
            { company: { archivedAt: null } },
        ];
        if (filters.ownerIds?.length)
            and.push({ ownerId: { in: filters.ownerIds } });
        if (filters.teams?.length)
            and.push({ owner: (0, team_scope_util_1.userTeamFilterWhere)(filters.teams) });
        if (filters.stages?.length)
            and.push({ OR: [
                    { stageId: { in: filters.stages } },
                    { stage: { code: { in: filters.stages.map((item) => item.toUpperCase()) } } },
                ] });
        if (filters.priorities?.length)
            and.push({ priority: { in: filters.priorities } });
        if (filters.industries?.length)
            and.push({ company: { industry: { in: filters.industries } } });
        if (filters.sources?.length)
            and.push({ source: { in: filters.sources } });
        if (filters.companyIds?.length)
            and.push({ companyId: { in: filters.companyIds } });
        if (applyCreatedAt) {
            const { range } = this.dateRange(filters);
            if (range)
                and.push({ createdAt: range });
        }
        and.push(this.opportunityOwnershipScopeWhere(filters.ownershipScope, user));
        return { AND: and };
    }
    dateRange(filters, defaultToLast30Days = false) {
        const defaultStartDate = defaultToLast30Days ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined;
        const defaultEndDate = defaultToLast30Days ? new Date() : undefined;
        const range = (0, api_date_util_1.parseApiDateRange)(filters.startDate, filters.endDate, 'startDate', 'endDate');
        const explicitEndDate = filters.endDate ? (0, api_date_util_1.parseApiDate)(filters.endDate, 'endDate') : undefined;
        return {
            startDate: range?.gte ?? defaultStartDate,
            endDate: explicitEndDate ?? defaultEndDate,
            range: range ?? (defaultToLast30Days ? { gte: defaultStartDate, lte: defaultEndDate } : undefined),
        };
    }
    activityWhere(filters, user, defaultToLast30Days = false) {
        const { range } = this.dateRange(filters, defaultToLast30Days);
        const companyFilters = { ...filters, teams: undefined };
        const and = [{ company: this.companyWhere(companyFilters, user) }];
        if (range)
            and.push({ occurredAt: range });
        if (filters.userIds?.length)
            and.push({ userId: { in: filters.userIds } });
        if (filters.activityTypes?.length)
            and.push({ type: { in: filters.activityTypes } });
        if (filters.teams?.length)
            and.push({ user: (0, team_scope_util_1.userTeamFilterWhere)(filters.teams) });
        return { AND: and };
    }
    companyOwnershipScopeWhere(scope, user) {
        switch (scope ?? ownership_scope_dto_1.OwnershipScope.ALL) {
            case ownership_scope_dto_1.OwnershipScope.MINE:
                return { ownerId: user.userId };
            case ownership_scope_dto_1.OwnershipScope.TEAM:
                return { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) };
            case ownership_scope_dto_1.OwnershipScope.UNASSIGNED:
                return { ownerId: null };
            default:
                return {};
        }
    }
    opportunityOwnershipScopeWhere(scope, user) {
        switch (scope ?? ownership_scope_dto_1.OwnershipScope.ALL) {
            case ownership_scope_dto_1.OwnershipScope.MINE:
                return { OR: [{ ownerId: user.userId }, { company: { ownerId: user.userId } }] };
            case ownership_scope_dto_1.OwnershipScope.TEAM:
                return { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) };
            case ownership_scope_dto_1.OwnershipScope.UNASSIGNED:
                return { ownerId: null };
            default:
                return {};
        }
    }
    async getConversionRates(filters, user) {
        const where = this.opportunityWhere(filters, user);
        const { range, startDate, endDate } = this.dateRange(filters);
        const historyWhere = {
            opportunity: where,
            ...(range && { changedAt: range }),
        };
        const [transitions, qualifyingOpportunityRows, movementCounts, reachedRows, wonRows] = await Promise.all([
            this.prisma.pipelineStageTransition.findMany({
                where: {
                    isAllowed: true,
                    toStage: { isActive: true },
                    OR: [{ fromStageId: null }, { fromStage: { isActive: true } }],
                },
                include: {
                    fromStage: true,
                    toStage: true,
                },
            }),
            this.prisma.opportunityStageHistory.findMany({
                where: historyWhere,
                select: { opportunityId: true },
                distinct: ['opportunityId'],
            }),
            this.prisma.opportunityStageHistory.groupBy({
                by: ['fromStageId', 'toStageId'],
                where: historyWhere,
                _count: { opportunityId: true },
            }),
            this.prisma.opportunityStageHistory.findMany({
                where: historyWhere,
                select: {
                    opportunityId: true,
                    toStageId: true,
                },
                distinct: ['opportunityId', 'toStageId'],
            }),
            this.prisma.opportunityStageHistory.findMany({
                where: { AND: [historyWhere, { toStage: { terminalType: 'WON' } }] },
                select: { opportunityId: true },
                distinct: ['opportunityId'],
            }),
        ]);
        const totalOpportunities = qualifyingOpportunityRows.length;
        const uniqueTransitions = new Map();
        for (const transition of transitions) {
            const key = this.transitionKey(transition.fromStageId, transition.toStageId);
            if (!uniqueTransitions.has(key)) {
                uniqueTransitions.set(key, transition);
            }
        }
        const movementMap = new Map(movementCounts.map((item) => [
            this.transitionKey(item.fromStageId, item.toStageId),
            item._count.opportunityId,
        ]));
        const reachedMap = new Map();
        for (const item of reachedRows) {
            reachedMap.set(item.toStageId, (reachedMap.get(item.toStageId) ?? 0) + 1);
        }
        const rows = [...uniqueTransitions.values()]
            .sort((a, b) => {
            const fromSortA = a.fromStage?.sortOrder ?? -1;
            const fromSortB = b.fromStage?.sortOrder ?? -1;
            if (fromSortA !== fromSortB)
                return fromSortA - fromSortB;
            return a.toStage.sortOrder - b.toStage.sortOrder;
        })
            .map((transition) => {
            const toCount = movementMap.get(this.transitionKey(transition.fromStageId, transition.toStageId)) ?? 0;
            const fromCount = transition.fromStageId
                ? reachedMap.get(transition.fromStageId) ?? 0
                : totalOpportunities;
            return {
                fromStageId: transition.fromStageId,
                fromStage: transition.fromStage?.code ?? null,
                fromLabel: transition.fromStage?.label ?? 'ورودی اولیه',
                toStageId: transition.toStageId,
                toStage: transition.toStage.code,
                toLabel: transition.toStage.label,
                fromCount,
                toCount,
                conversionRate: this.percent(toCount, fromCount),
            };
        });
        const wonCount = wonRows.length;
        return {
            stages: rows,
            summary: {
                totalCompanies: totalOpportunities,
                completedCompanies: wonCount,
                overallConversionRate: this.percent(wonCount, totalOpportunities),
                totalOpportunities,
                wonOpportunities: wonCount,
                overallOpportunityConversionRate: this.percent(wonCount, totalOpportunities),
            },
            period: this.period(startDate, endDate, 'STAGE_TRANSITION_CHANGED_AT'),
        };
    }
    async getAverageStageDuration(filters, user) {
        const opportunityFilters = { ...filters, stages: undefined };
        const [histories, stages] = await Promise.all([
            this.prisma.opportunityStageHistory.findMany({
                where: {
                    opportunity: this.opportunityWhere(opportunityFilters, user),
                },
                select: {
                    opportunityId: true,
                    fromStageId: true,
                    fromStage: {
                        select: {
                            id: true,
                            code: true,
                            label: true,
                            sortOrder: true,
                        },
                    },
                    changedAt: true,
                },
                orderBy: [{ opportunityId: 'asc' }, { changedAt: 'asc' }],
            }),
            this.prisma.pipelineStage.findMany({
                select: {
                    id: true,
                    code: true,
                    label: true,
                    sortOrder: true,
                },
            }),
        ]);
        const stageByCode = new Map(stages.map((stage) => [stage.code, stage]));
        const durations = new Map();
        const previous = new Map();
        const { range } = this.dateRange(filters);
        for (const item of histories) {
            const previousDate = previous.get(item.opportunityId);
            const stageFilterMatches = !filters.stages?.length ||
                filters.stages.includes(item.fromStageId ?? '') ||
                (item.fromStage && filters.stages.map((value) => value.toUpperCase()).includes(item.fromStage.code));
            const exitInPeriod = !range || this.dateMatchesRange(item.changedAt, range);
            if (previousDate && item.fromStage && stageFilterMatches && exitInPeriod) {
                const days = (item.changedAt.getTime() - previousDate.getTime()) / 86_400_000;
                durations.set(item.fromStage.code, [
                    ...(durations.get(item.fromStage.code) || []),
                    days,
                ]);
            }
            previous.set(item.opportunityId, item.changedAt);
        }
        return [...durations.entries()]
            .map(([stage, values]) => {
            const config = stageByCode.get(stage);
            return {
                stage,
                stageId: config?.id,
                label: config?.label,
                sortOrder: config?.sortOrder,
                sample_count: values.length,
                avg_duration_days: this.round(values.reduce((sum, value) => sum + value, 0) / values.length),
                min_duration_days: this.round(Math.min(...values)),
                max_duration_days: this.round(Math.max(...values)),
            };
        })
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    async getPipelineSummary(filters, user) {
        const where = this.opportunityWhere(filters, user, true);
        const { startDate, endDate } = this.dateRange(filters);
        const [stageCounts, stages] = await Promise.all([
            this.prisma.opportunity.groupBy({
                by: ['stageId'],
                where,
                _count: { id: true },
                orderBy: { stageId: 'asc' },
            }),
            this.prisma.pipelineStage.findMany({
                orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
            }),
        ]);
        const totalOpportunities = stageCounts.reduce((sum, item) => sum + item._count.id, 0);
        const countMap = new Map(stageCounts.map((item) => [item.stageId, item._count.id]));
        const wonCount = stages
            .filter((stage) => stage.terminalType === 'WON')
            .reduce((sum, stage) => sum + (countMap.get(stage.id) ?? 0), 0);
        const lostCount = stages
            .filter((stage) => stage.terminalType === 'LOST')
            .reduce((sum, stage) => sum + (countMap.get(stage.id) ?? 0), 0);
        const activeCount = stages
            .filter((stage) => !stage.isTerminal && stage.terminalType === null)
            .reduce((sum, stage) => sum + (countMap.get(stage.id) ?? 0), 0);
        return {
            stages: stages.map((stage) => {
                const count = countMap.get(stage.id) ?? 0;
                return {
                    stage: stage.code,
                    stageId: stage.id,
                    label: stage.label,
                    sortOrder: stage.sortOrder,
                    count,
                    percentage: this.percent(count, totalOpportunities),
                };
            }),
            summary: {
                totalCompanies: totalOpportunities,
                activeCompanies: activeCount,
                lostCompanies: lostCount,
                lostRate: this.percent(lostCount, totalOpportunities),
                totalOpportunities,
                activeOpportunities: activeCount,
                wonOpportunities: wonCount,
                lostOpportunities: lostCount,
                wonRate: this.percent(wonCount, totalOpportunities),
                lostOpportunityRate: this.percent(lostCount, totalOpportunities),
            },
            period: this.period(startDate, endDate, 'OPPORTUNITY_CREATED_AT'),
        };
    }
    async getActivityReport(filters, user) {
        const { startDate, endDate } = this.dateRange(filters);
        const activities = await this.prisma.activity.groupBy({
            by: ['type'], where: this.activityWhere(filters, user), _count: { id: true }, orderBy: { type: 'asc' },
        });
        const totalActivities = activities.reduce((sum, item) => sum + item._count.id, 0);
        return {
            startDate,
            endDate,
            totalActivities,
            breakdown: activities.map((item) => ({
                type: item.type,
                count: item._count.id,
                percentage: totalActivities ? Math.round((item._count.id / totalActivities) * 100) : 0,
            })),
            period: this.period(startDate, endDate, 'ACTIVITY_OCCURRED_AT'),
        };
    }
    async getUserPerformance(filters, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const { range, startDate, endDate } = this.dateRange(filters);
        const requestedUserIds = filters.userIds?.length ? [...new Set(filters.userIds)] : undefined;
        const users = await this.prisma.user.findMany({
            where: {
                organizationId,
                isActive: true,
                ...(requestedUserIds ? { id: { in: requestedUserIds } } : {}),
                ...(filters.teams?.length ? { teamRef: { id: { in: filters.teams } } } : {}),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                teamId: true,
                teamRef: { select: { id: true, code: true, name: true } },
            },
            orderBy: { fullName: 'asc' },
        });
        const userIds = users.map((item) => item.id);
        if (requestedUserIds && userIds.length !== requestedUserIds.length) {
            return this.emptyUserPerformance(startDate, endDate, users, (0, financial_visibility_1.canViewFinancials)(user));
        }
        const actorFilter = userIds.length ? { in: userIds } : { in: ['__none__'] };
        const dated = range ? { createdAt: range } : {};
        const [activityTypes, activityCounts, companyAudits, opportunityAudits, createdTasks, assignedTasks, meetings] = await Promise.all([
            this.prisma.lookupOption.findMany({
                where: { group: 'activity-types', isActive: true },
                select: { code: true, label: true, sortOrder: true },
                orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            }),
            this.prisma.activity.groupBy({
                by: ['userId', 'type'],
                where: {
                    userId: actorFilter,
                    user: { organizationId },
                    type: { not: activity_type_1.ActivityType.STAGE_CHANGE },
                    ...(range ? { occurredAt: range } : {}),
                },
                _count: { id: true },
            }),
            this.prisma.auditLog.findMany({
                where: {
                    organizationId,
                    actorId: actorFilter,
                    action: 'company.created',
                    ...dated,
                },
                select: { actorId: true, entityId: true },
            }),
            this.prisma.auditLog.findMany({
                where: {
                    organizationId,
                    actorId: actorFilter,
                    action: 'opportunity.created',
                    ...dated,
                },
                select: { actorId: true, entityId: true },
            }),
            this.prisma.task.groupBy({
                by: ['createdById'],
                where: {
                    organizationId,
                    createdById: actorFilter,
                    ...(range ? { createdAt: range } : {}),
                },
                _count: { id: true },
            }),
            this.prisma.task.groupBy({
                by: ['assignedToId', 'status'],
                where: {
                    organizationId,
                    assignedToId: actorFilter,
                    ...(range ? { createdAt: range } : {}),
                },
                _count: { id: true },
            }),
            this.prisma.meeting.groupBy({
                by: ['organizerId'],
                where: {
                    organizationId,
                    organizerId: actorFilter,
                    ...(range ? { startAt: range } : {}),
                },
                _count: { id: true },
            }),
        ]);
        const opportunityIds = [
            ...new Set(opportunityAudits
                .map((item) => item.entityId)
                .filter((id) => Boolean(id))),
        ];
        const opportunities = opportunityIds.length
            ? await this.prisma.opportunity.findMany({
                where: { organizationId, id: { in: opportunityIds } },
                select: {
                    id: true,
                    estimatedValue: true,
                    stage: { select: { isTerminal: true, terminalType: true } },
                },
            })
            : [];
        const activeTypeCodes = new Set(activityTypes.map((item) => item.code));
        const manualActivityCounts = activityCounts.filter((item) => activeTypeCodes.has(item.type));
        const activityTotalFor = (userId, code) => manualActivityCounts
            .filter((item) => item.userId === userId && (!code || item.type === code))
            .reduce((sum, item) => sum + item._count.id, 0);
        const typeTotals = new Map(activityTypes.map((type) => [
            type.code,
            manualActivityCounts
                .filter((item) => item.type === type.code)
                .reduce((sum, item) => sum + item._count.id, 0),
        ]));
        const activityBreakdown = activityTypes.map((item) => ({
            code: item.code,
            label: item.label,
            count: typeTotals.get(item.code) ?? 0,
        }));
        const completedAssigned = assignedTasks.filter((item) => item.status === 'DONE')
            .reduce((sum, item) => sum + item._count.id, 0);
        const assignedTotal = assignedTasks.reduce((sum, item) => sum + item._count.id, 0);
        const classify = (opportunity) => opportunity.stage.terminalType === 'WON'
            ? 'won'
            : opportunity.stage.terminalType === 'LOST'
                ? 'lost'
                : 'active';
        const financialVisible = (0, financial_visibility_1.canViewFinancials)(user);
        const opportunityActorById = new Map(opportunityAudits
            .filter((item) => Boolean(item.actorId && item.entityId))
            .map((item) => [item.entityId, item.actorId]));
        const opportunitiesFor = (userId) => opportunities.filter((item) => opportunityActorById.get(item.id) === userId);
        const opportunitySummary = (items) => {
            const valueFor = (kind) => items
                .filter((item) => classify(item) === kind)
                .reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0);
            return {
                total: items.length,
                active: items.filter((item) => classify(item) === 'active').length,
                won: items.filter((item) => classify(item) === 'won').length,
                lost: items.filter((item) => classify(item) === 'lost').length,
                totalValue: financialVisible ? items.reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0) : null,
                activeValue: financialVisible ? valueFor('active') : null,
                wonValue: financialVisible ? valueFor('won') : null,
                lostValue: financialVisible ? valueFor('lost') : null,
            };
        };
        const meetingsFor = (userId) => meetings
            .filter((item) => item.organizerId === userId)
            .reduce((sum, item) => sum + item._count.id, 0);
        const members = users.map((member) => {
            const memberAssigned = assignedTasks.filter((item) => item.assignedToId === member.id);
            const assignedTotalForMember = memberAssigned.reduce((sum, item) => sum + item._count.id, 0);
            const completedForMember = memberAssigned
                .filter((item) => item.status === 'DONE')
                .reduce((sum, item) => sum + item._count.id, 0);
            const breakdown = activityTypes.map((type) => {
                const count = activityTotalFor(member.id, type.code);
                const total = typeTotals.get(type.code) ?? 0;
                return { code: type.code, label: type.label, count, percentage: this.percent(count, total) };
            });
            return {
                user: member,
                activity: {
                    total: activityTotalFor(member.id),
                    breakdown,
                },
                companiesCreated: new Set(companyAudits
                    .filter((item) => item.actorId === member.id)
                    .map((item) => item.entityId)
                    .filter(Boolean)).size,
                meetings: meetingsFor(member.id),
                tasksCreated: createdTasks
                    .filter((item) => item.createdById === member.id)
                    .reduce((sum, item) => sum + item._count.id, 0),
                tasksAssigned: {
                    total: assignedTotalForMember,
                    completed: completedForMember,
                    incomplete: assignedTotalForMember - completedForMember,
                },
                opportunities: opportunitySummary(opportunitiesFor(member.id)),
            };
        });
        return {
            period: {
                startDate: startDate?.toISOString() ?? null,
                endDate: endDate?.toISOString() ?? null,
                dateBasis: {
                    activities: 'occurredAt',
                    companies: 'audit.createdAt',
                    meetings: 'startAt',
                    tasks: 'createdAt',
                    opportunities: 'audit.createdAt',
                },
            },
            users,
            members,
            activity: {
                total: manualActivityCounts.reduce((sum, item) => sum + item._count.id, 0),
                breakdown: activityBreakdown,
                uncataloguedCount: 0,
            },
            companiesCreated: new Set(companyAudits.map((item) => item.entityId).filter(Boolean)).size,
            meetings: meetings.reduce((sum, item) => sum + item._count.id, 0),
            tasksCreated: createdTasks.reduce((sum, item) => sum + item._count.id, 0),
            tasksAssigned: {
                total: assignedTotal,
                completed: completedAssigned,
                incomplete: assignedTotal - completedAssigned,
            },
            opportunities: opportunitySummary(opportunities),
            financialVisible,
        };
    }
    emptyUserPerformance(startDate, endDate, users, financialVisible) {
        return {
            period: {
                startDate: startDate?.toISOString() ?? null,
                endDate: endDate?.toISOString() ?? null,
                dateBasis: {
                    activities: 'occurredAt',
                    companies: 'audit.createdAt',
                    meetings: 'startAt',
                    tasks: 'createdAt',
                    opportunities: 'audit.createdAt',
                },
            },
            users,
            members: [],
            activity: { total: 0, breakdown: [], uncataloguedCount: 0 },
            companiesCreated: 0,
            meetings: 0,
            tasksCreated: 0,
            tasksAssigned: { total: 0, completed: 0, incomplete: 0 },
            opportunities: {
                total: 0,
                active: 0,
                won: 0,
                lost: 0,
                totalValue: financialVisible ? 0 : null,
                activeValue: financialVisible ? 0 : null,
                wonValue: financialVisible ? 0 : null,
                lostValue: financialVisible ? 0 : null,
            },
            financialVisible,
        };
    }
    async getActivitiesByUser(filters, user) {
        const userWhere = this.reportUserWhere(filters, user);
        const users = await this.prisma.user.findMany({
            where: userWhere,
            select: { id: true, fullName: true, team: true },
            orderBy: { fullName: 'asc' },
        });
        const allowedIds = users.map((item) => item.id);
        const counts = allowedIds.length ? await this.prisma.activity.groupBy({
            by: ['userId', 'type'],
            where: { AND: [this.activityWhere(filters, user), { userId: { in: allowedIds } }] },
            _count: { id: true },
        }) : [];
        const count = (userId, type) => counts
            .filter((item) => item.userId === userId && (!type || item.type === type))
            .reduce((sum, item) => sum + item._count.id, 0);
        return users.map((item) => ({
            userId: item.id,
            fullName: item.fullName,
            team: item.team,
            totalActivities: count(item.id),
            calls: count(item.id, activity_type_1.ActivityType.CALL),
            emails: count(item.id, activity_type_1.ActivityType.EMAIL),
            meetings: count(item.id, activity_type_1.ActivityType.MEETING),
            notes: count(item.id, activity_type_1.ActivityType.NOTE),
            linkedinMessages: count(item.id, activity_type_1.ActivityType.LINKEDIN_MESSAGE),
            linkedinEngagements: count(item.id, activity_type_1.ActivityType.LINKEDIN_ENGAGEMENT),
        }));
    }
    async getPipelineByOwner(filters, user) {
        const [opportunities, stages] = await Promise.all([
            this.prisma.opportunity.findMany({
                where: {
                    AND: [this.opportunityWhere(filters, user, true), { ownerId: { not: null } }],
                },
                select: {
                    ownerId: true,
                    stageId: true,
                    stage: true,
                    owner: {
                        select: {
                            fullName: true,
                            team: true,
                        },
                    },
                },
            }),
            this.prisma.pipelineStage.findMany({
                orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
            }),
        ]);
        const owners = new Map();
        for (const opportunity of opportunities) {
            if (!opportunity.ownerId)
                continue;
            owners.set(opportunity.ownerId, [
                ...(owners.get(opportunity.ownerId) || []),
                opportunity,
            ]);
        }
        return [...owners.entries()]
            .map(([ownerId, items]) => {
            const wonOpportunities = items.filter((item) => item.stage.terminalType === 'WON').length;
            const lostOpportunities = items.filter((item) => item.stage.terminalType === 'LOST').length;
            const totalOpportunities = items.length;
            const activeOpportunities = items.filter((item) => !item.stage.isTerminal && item.stage.terminalType === null).length;
            return {
                ownerId,
                fullName: items[0].owner?.fullName || '',
                team: items[0].owner?.team ?? null,
                totalCompanies: totalOpportunities,
                activeCompanies: activeOpportunities,
                doneCompanies: wonOpportunities,
                lostCompanies: lostOpportunities,
                totalOpportunities,
                activeOpportunities,
                wonOpportunities,
                lostOpportunities,
                conversionRate: this.percent(wonOpportunities, totalOpportunities),
                lostRate: this.percent(lostOpportunities, totalOpportunities),
                stages: stages.map((stage) => ({
                    stage: stage.code,
                    stageId: stage.id,
                    label: stage.label,
                    sortOrder: stage.sortOrder,
                    count: items.filter((item) => item.stageId === stage.id).length,
                })),
            };
        })
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    async getFilterOptions(user) {
        const userWhere = this.reportUserWhere({}, user);
        const [users, teams, industries, leadSources, stages] = await Promise.all([
            this.prisma.user.findMany({
                where: userWhere,
                select: {
                    id: true,
                    fullName: true,
                    role: true,
                    team: true,
                    teamId: true,
                    teamRef: {
                        select: {
                            code: true,
                            name: true,
                        },
                    },
                    isActive: true,
                },
                orderBy: { fullName: 'asc' },
            }),
            this.prisma.team.findMany({
                where: {
                    isActive: true,
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                },
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.industry.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.leadSource.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    sortOrder: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            }),
            this.prisma.pipelineStage.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    code: true,
                    label: true,
                    sortOrder: true,
                    color: true,
                    isTerminal: true,
                    terminalType: true,
                    isDefault: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
            }),
        ]);
        const activeUsers = users.filter((item) => item.isActive);
        const owners = activeUsers.filter((item) => item.role === client_1.UserRole.REP || item.role === client_1.UserRole.MANAGER);
        const managedTeamValues = new Set(teams.flatMap((team) => [team.id, team.code, team.name]));
        const legacyTeams = [
            ...new Set(activeUsers
                .map((item) => item.team)
                .filter((value) => value !== null && value !== '' && !managedTeamValues.has(value))),
        ].sort();
        const priorityOptions = [
            { value: client_1.Priority.LOW, label: 'کم' },
            { value: client_1.Priority.MEDIUM, label: 'متوسط' },
            { value: client_1.Priority.HIGH, label: 'زیاد' },
            { value: client_1.Priority.STRATEGIC, label: 'استراتژیک' },
        ];
        const activityTypeOptions = [
            { value: activity_type_1.ActivityType.CALL, label: 'تماس' },
            { value: activity_type_1.ActivityType.EMAIL, label: 'ایمیل' },
            { value: activity_type_1.ActivityType.LINKEDIN_MESSAGE, label: 'پیام لینکدین' },
            { value: activity_type_1.ActivityType.LINKEDIN_ENGAGEMENT, label: 'تعامل لینکدین' },
            { value: activity_type_1.ActivityType.MEETING, label: 'جلسه' },
            { value: activity_type_1.ActivityType.NOTE, label: 'یادداشت' },
            { value: activity_type_1.ActivityType.STAGE_CHANGE, label: 'تغییر مرحله' },
        ];
        return {
            users: activeUsers.map((item) => ({
                value: item.id,
                id: item.id,
                label: item.fullName,
                fullName: item.fullName,
                team: item.team,
                teamId: item.teamId,
                teamCode: item.teamRef?.code ?? item.team,
                teamName: item.teamRef?.name ?? null,
                role: item.role,
            })),
            owners: owners.map((item) => ({
                value: item.id,
                id: item.id,
                label: item.fullName,
                fullName: item.fullName,
                team: item.team,
                teamId: item.teamId,
                teamCode: item.teamRef?.code ?? item.team,
                teamName: item.teamRef?.name ?? null,
                role: item.role,
            })),
            teams: [
                ...teams.map((team) => ({
                    value: team.id,
                    id: team.id,
                    code: team.code,
                    label: team.name,
                    name: team.name,
                })),
                ...legacyTeams.map((team) => ({
                    value: team,
                    label: team,
                    legacy: true,
                })),
            ],
            industries: industries.map((item) => ({
                value: item.name,
                id: item.id,
                label: item.name,
                name: item.name,
            })),
            sources: leadSources.map((item) => ({
                value: item.code,
                id: item.id,
                code: item.code,
                label: item.name,
                name: item.name,
                sortOrder: item.sortOrder,
            })),
            leadSources: leadSources.map((item) => ({
                value: item.code,
                id: item.id,
                code: item.code,
                label: item.name,
                name: item.name,
                sortOrder: item.sortOrder,
            })),
            stages: stages.map((item) => ({
                value: item.id,
                id: item.id,
                code: item.code,
                label: item.label,
                sortOrder: item.sortOrder,
                color: item.color,
                isTerminal: item.isTerminal,
                terminalType: item.terminalType,
                isDefault: item.isDefault,
            })),
            pipelineStages: stages.map((item) => ({
                value: item.id,
                id: item.id,
                code: item.code,
                label: item.label,
                sortOrder: item.sortOrder,
                color: item.color,
                isTerminal: item.isTerminal,
                terminalType: item.terminalType,
                isDefault: item.isDefault,
            })),
            priorities: priorityOptions,
            priorityOptions,
            activityTypes: activityTypeOptions,
            activityTypeOptions,
        };
    }
    reportUserWhere(filters, user) {
        const and = [
            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
        ];
        if (filters.userIds?.length)
            and.push({ id: { in: filters.userIds } });
        if (filters.teams?.length)
            and.push((0, team_scope_util_1.userTeamFilterWhere)(filters.teams));
        return and.length ? { AND: and } : {};
    }
    dateMatchesRange(date, range) {
        return (!range.gte || date >= range.gte) && (!range.lte || date <= range.lte) && (!range.lt || date < range.lt);
    }
    period(startDate, endDate, dateBasis) {
        return {
            startDate: startDate?.toISOString() ?? null,
            endDate: endDate?.toISOString() ?? null,
            dateBasis,
        };
    }
    round(value) {
        return Math.round(value * 100) / 100;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map