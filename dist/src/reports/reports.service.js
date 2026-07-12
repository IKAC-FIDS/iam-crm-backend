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
const prisma_service_1 = require("../prisma/prisma.service");
const api_date_util_1 = require("../common/dates/api-date.util");
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
        const and = [];
        if (filters.ownerIds?.length)
            and.push({ ownerId: { in: filters.ownerIds } });
        if (filters.teams?.length)
            and.push({ owner: { team: { in: filters.teams } } });
        if (filters.priorities?.length)
            and.push({ priority: { in: filters.priorities } });
        if (filters.industries?.length)
            and.push({ industry: { in: filters.industries } });
        if (filters.sources?.length)
            and.push({ source: { in: filters.sources } });
        if (filters.companyIds?.length)
            and.push({ id: { in: filters.companyIds } });
        if (user.role === client_1.UserRole.MANAGER) {
            if (!user.team)
                return { id: { in: [] } };
            and.push({ owner: { team: user.team } });
        }
        else if (user.role === client_1.UserRole.REP) {
            and.push({ ownerId: user.userId });
        }
        return and.length ? { AND: and } : {};
    }
    opportunityWhere(filters, user) {
        const and = [{ archivedAt: null }, { company: { archivedAt: null } }];
        if (filters.ownerIds?.length)
            and.push({ ownerId: { in: filters.ownerIds } });
        if (filters.teams?.length)
            and.push({ owner: { team: { in: filters.teams } } });
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
        if (user.role === client_1.UserRole.MANAGER) {
            and.push(user.team ? { company: { owner: { team: user.team } } } : { id: { in: [] } });
        }
        else if (user.role === client_1.UserRole.REP) {
            and.push({ OR: [{ ownerId: user.userId }, { company: { ownerId: user.userId } }] });
        }
        return { AND: and };
    }
    dateRange(filters, defaultToLast30Days = false) {
        const defaultStartDate = defaultToLast30Days ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined;
        const defaultEndDate = defaultToLast30Days ? new Date() : undefined;
        const range = (0, api_date_util_1.parseApiDateRange)(filters.startDate, filters.endDate, 'startDate', 'endDate');
        return {
            startDate: range?.gte ?? defaultStartDate,
            endDate: range?.lte ?? range?.lt ?? defaultEndDate,
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
            and.push({ user: { team: { in: filters.teams } } });
        if (user.role === client_1.UserRole.MANAGER) {
            if (!user.team)
                return { id: { in: [] } };
            and.push({ user: { team: user.team } });
        }
        else if (user.role === client_1.UserRole.REP) {
            and.push({ userId: user.userId });
        }
        return { AND: and };
    }
    async getConversionRates(filters, user) {
        const where = this.opportunityWhere(filters, user);
        const [transitions, totalOpportunities, movementCounts, reachedRows, wonStages] = await Promise.all([
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
            this.prisma.opportunity.count({ where }),
            this.prisma.opportunityStageHistory.groupBy({
                by: ['fromStageId', 'toStageId'],
                where: {
                    opportunity: where,
                },
                _count: { opportunityId: true },
            }),
            this.prisma.opportunityStageHistory.findMany({
                where: {
                    opportunity: where,
                },
                select: {
                    opportunityId: true,
                    toStageId: true,
                },
                distinct: ['opportunityId', 'toStageId'],
            }),
            this.prisma.pipelineStage.findMany({
                where: { terminalType: 'WON' },
                select: { id: true },
            }),
        ]);
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
        const wonStageIds = wonStages.map((stage) => stage.id);
        const wonCount = wonStageIds.length
            ? await this.prisma.opportunity.count({
                where: {
                    AND: [where, { stageId: { in: wonStageIds } }],
                },
            })
            : 0;
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
        for (const item of histories) {
            const previousDate = previous.get(item.opportunityId);
            const stageFilterMatches = !filters.stages?.length ||
                filters.stages.includes(item.fromStageId ?? '') ||
                (item.fromStage && filters.stages.map((value) => value.toUpperCase()).includes(item.fromStage.code));
            if (previousDate && item.fromStage && stageFilterMatches) {
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
        const where = this.opportunityWhere(filters, user);
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
        const activeCount = totalOpportunities - wonCount - lostCount;
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
        };
    }
    async getActivityReport(filters, user) {
        const { startDate, endDate } = this.dateRange(filters, true);
        const activities = await this.prisma.activity.groupBy({
            by: ['type'], where: this.activityWhere(filters, user, true), _count: { id: true }, orderBy: { type: 'asc' },
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
            calls: count(item.id, client_1.ActivityType.CALL),
            emails: count(item.id, client_1.ActivityType.EMAIL),
            meetings: count(item.id, client_1.ActivityType.MEETING),
            notes: count(item.id, client_1.ActivityType.NOTE),
            linkedinMessages: count(item.id, client_1.ActivityType.LINKEDIN_MESSAGE),
            linkedinEngagements: count(item.id, client_1.ActivityType.LINKEDIN_ENGAGEMENT),
        }));
    }
    async getPipelineByOwner(filters, user) {
        const [opportunities, stages] = await Promise.all([
            this.prisma.opportunity.findMany({
                where: {
                    AND: [this.opportunityWhere(filters, user), { ownerId: { not: null } }],
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
            const activeOpportunities = totalOpportunities - wonOpportunities - lostOpportunities;
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
        const [users, industries, leadSources, stages] = await Promise.all([
            this.prisma.user.findMany({
                where: userWhere,
                select: {
                    id: true,
                    fullName: true,
                    role: true,
                    team: true,
                    isActive: true,
                },
                orderBy: { fullName: 'asc' },
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
        const uniqueTeams = [
            ...new Set(activeUsers
                .map((item) => item.team)
                .filter((value) => Boolean(value))),
        ].sort();
        const priorityOptions = [
            { value: client_1.Priority.LOW, label: 'کم' },
            { value: client_1.Priority.MEDIUM, label: 'متوسط' },
            { value: client_1.Priority.HIGH, label: 'زیاد' },
            { value: client_1.Priority.STRATEGIC, label: 'استراتژیک' },
        ];
        const activityTypeOptions = [
            { value: client_1.ActivityType.CALL, label: 'تماس' },
            { value: client_1.ActivityType.EMAIL, label: 'ایمیل' },
            { value: client_1.ActivityType.LINKEDIN_MESSAGE, label: 'پیام لینکدین' },
            { value: client_1.ActivityType.LINKEDIN_ENGAGEMENT, label: 'تعامل لینکدین' },
            { value: client_1.ActivityType.MEETING, label: 'جلسه' },
            { value: client_1.ActivityType.NOTE, label: 'یادداشت' },
            { value: client_1.ActivityType.STAGE_CHANGE, label: 'تغییر مرحله' },
        ];
        return {
            users: activeUsers.map((item) => ({
                value: item.id,
                id: item.id,
                label: item.fullName,
                fullName: item.fullName,
                team: item.team,
                role: item.role,
            })),
            owners: owners.map((item) => ({
                value: item.id,
                id: item.id,
                label: item.fullName,
                fullName: item.fullName,
                team: item.team,
                role: item.role,
            })),
            teams: uniqueTeams.map((team) => ({
                value: team,
                label: team,
            })),
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
        const and = [];
        if (filters.userIds?.length)
            and.push({ id: { in: filters.userIds } });
        if (filters.teams?.length)
            and.push({ team: { in: filters.teams } });
        if (user.role === client_1.UserRole.MANAGER) {
            if (!user.team)
                return { id: { in: [] } };
            and.push({ team: user.team });
        }
        else if (user.role === client_1.UserRole.REP) {
            and.push({ id: user.userId });
        }
        return and.length ? { AND: and } : {};
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