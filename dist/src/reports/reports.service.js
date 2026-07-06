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
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
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
        const startDate = filters.startDate
            ? new Date(filters.startDate)
            : defaultToLast30Days ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined;
        const endDate = filters.endDate ? new Date(filters.endDate) : defaultToLast30Days ? new Date() : undefined;
        if (startDate && endDate && startDate > endDate) {
            throw new common_1.BadRequestException('startDate must be before or equal to endDate');
        }
        return { startDate, endDate };
    }
    activityWhere(filters, user, defaultToLast30Days = false) {
        const { startDate, endDate } = this.dateRange(filters, defaultToLast30Days);
        const companyFilters = { ...filters, teams: undefined };
        const and = [{ company: this.companyWhere(companyFilters, user) }];
        if (startDate || endDate)
            and.push({ occurredAt: { gte: startDate, lte: endDate } });
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
        const stages = await this.prisma.pipelineStage.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
        const stageCounts = await this.prisma.opportunityStageHistory.groupBy({
            by: ['toStageId'],
            where: { opportunity: this.opportunityWhere(filters, user) },
            _count: { opportunityId: true },
            orderBy: { toStageId: 'asc' },
        });
        const countsMap = new Map(stageCounts.map((item) => [item.toStageId, item._count.opportunityId]));
        const results = [];
        for (let i = 0; i < stages.length - 1; i++) {
            const from = stages[i];
            const to = stages[i + 1];
            const fromCount = countsMap.get(from.id) || 0;
            const toCount = countsMap.get(to.id) || 0;
            results.push({
                fromStage: from.code,
                toStage: to.code,
                fromCount,
                toCount,
                conversionRate: `${fromCount ? Math.round((toCount / fromCount) * 100) : 0}%`,
            });
        }
        const leadCount = stages.filter((item) => item.isDefault).reduce((sum, item) => sum + (countsMap.get(item.id) || 0), 0);
        const doneCount = stages.filter((item) => item.terminalType === 'WON').reduce((sum, item) => sum + (countsMap.get(item.id) || 0), 0);
        return {
            stages: results,
            summary: {
                totalCompanies: leadCount,
                completedCompanies: doneCount,
                overallConversionRate: leadCount ? Math.round((doneCount / leadCount) * 100) : 0,
            },
        };
    }
    async getAverageStageDuration(filters, user) {
        const opportunityFilters = { ...filters, stages: undefined };
        const histories = await this.prisma.opportunityStageHistory.findMany({
            where: { opportunity: this.opportunityWhere(opportunityFilters, user) },
            select: { opportunityId: true, fromStageId: true, fromStage: { select: { code: true } }, changedAt: true },
            orderBy: [{ opportunityId: 'asc' }, { changedAt: 'asc' }],
        });
        const durations = new Map();
        const previous = new Map();
        for (const item of histories) {
            const previousDate = previous.get(item.opportunityId);
            const stageFilterMatches = !filters.stages?.length || filters.stages.includes(item.fromStageId ?? '') || (item.fromStage && filters.stages.map((value) => value.toUpperCase()).includes(item.fromStage.code));
            if (previousDate && item.fromStage && stageFilterMatches) {
                const days = (item.changedAt.getTime() - previousDate.getTime()) / 86_400_000;
                durations.set(item.fromStage.code, [...(durations.get(item.fromStage.code) || []), days]);
            }
            previous.set(item.opportunityId, item.changedAt);
        }
        return [...durations.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([stage, values]) => ({
            stage,
            sample_count: values.length,
            avg_duration_days: this.round(values.reduce((sum, value) => sum + value, 0) / values.length),
            min_duration_days: this.round(Math.min(...values)),
            max_duration_days: this.round(Math.max(...values)),
        }));
    }
    async getPipelineSummary(filters, user) {
        const where = this.opportunityWhere(filters, user);
        const stageCounts = await this.prisma.opportunity.groupBy({
            by: ['stageId'], where, _count: { id: true }, orderBy: { stageId: 'asc' },
        });
        const totalCompanies = stageCounts.reduce((sum, item) => sum + item._count.id, 0);
        const stages = await this.prisma.pipelineStage.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
        const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
        const countMap = new Map(stageCounts.map((item) => [item.stageId, item._count.id]));
        const lostCount = stageCounts.filter((item) => stageMap.get(item.stageId)?.terminalType === 'LOST').reduce((sum, item) => sum + item._count.id, 0);
        return {
            stages: stages.filter((stage) => countMap.has(stage.id)).map((stage) => ({
                stage: stage.code,
                stageId: stage.id,
                label: stage.label,
                sortOrder: stage.sortOrder,
                count: countMap.get(stage.id) || 0,
                percentage: totalCompanies ? Math.round(((countMap.get(stage.id) || 0) / totalCompanies) * 100) : 0,
            })),
            summary: {
                totalCompanies,
                activeCompanies: totalCompanies - lostCount,
                lostCompanies: lostCount,
                lostRate: totalCompanies ? Math.round((lostCount / totalCompanies) * 100) : 0,
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
        const [companies, stages] = await Promise.all([
            this.prisma.opportunity.findMany({
                where: { AND: [this.opportunityWhere(filters, user), { ownerId: { not: null } }] },
                select: { ownerId: true, stageId: true, stage: true, owner: { select: { fullName: true, team: true } } },
            }),
            this.prisma.pipelineStage.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }),
        ]);
        const owners = new Map();
        for (const company of companies) {
            if (!company.ownerId)
                continue;
            owners.set(company.ownerId, [...(owners.get(company.ownerId) || []), company]);
        }
        return [...owners.entries()].map(([ownerId, items]) => {
            const doneCompanies = items.filter((item) => item.stage.terminalType === 'WON').length;
            const lostCompanies = items.filter((item) => item.stage.terminalType === 'LOST').length;
            const totalCompanies = items.length;
            return {
                ownerId,
                fullName: items[0].owner?.fullName || '',
                team: items[0].owner?.team ?? null,
                totalCompanies,
                activeCompanies: totalCompanies - doneCompanies - lostCompanies,
                doneCompanies,
                lostCompanies,
                conversionRate: totalCompanies ? Math.round((doneCompanies / totalCompanies) * 100) : 0,
                lostRate: totalCompanies ? Math.round((lostCompanies / totalCompanies) * 100) : 0,
                stages: stages.map((stage) => ({
                    stage: stage.code,
                    stageId: stage.id,
                    label: stage.label,
                    sortOrder: stage.sortOrder,
                    count: items.filter((item) => item.stageId === stage.id).length,
                })),
            };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    async getFilterOptions(user) {
        const companyWhere = this.companyWhere({}, user);
        const [users, companies, opportunities] = await Promise.all([
            this.prisma.user.findMany({
                where: this.reportUserWhere({}, user),
                select: { id: true, fullName: true, role: true, team: true },
                orderBy: { fullName: 'asc' },
            }),
            this.prisma.company.findMany({
                where: companyWhere,
                select: { industry: true, source: true },
            }),
            this.prisma.opportunity.findMany({
                where: this.opportunityWhere({}, user),
                select: { source: true },
            }),
        ]);
        const unique = (values) => [...new Set(values.filter((value) => Boolean(value)))].sort();
        return {
            users,
            teams: unique(users.map((item) => item.team)),
            industries: unique(companies.map((item) => item.industry)),
            sources: unique([...companies.map((item) => item.source), ...opportunities.map((item) => item.source)]),
            stages: await this.prisma.pipelineStage.findMany({ where: { isActive: true }, select: { id: true, code: true, label: true, sortOrder: true, color: true, isTerminal: true, terminalType: true, isDefault: true }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }),
            priorities: Object.values(client_1.Priority),
            activityTypes: Object.values(client_1.ActivityType),
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