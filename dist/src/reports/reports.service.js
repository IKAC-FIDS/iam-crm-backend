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
        if (filters.stages?.length)
            and.push({ stage: { in: filters.stages } });
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
        const stages = Object.values(client_1.PipelineStage);
        const stageCounts = await this.prisma.pipelineStageHistory.groupBy({
            by: ['toStage'],
            where: { company: this.companyWhere(filters, user) },
            _count: { companyId: true },
            orderBy: { toStage: 'asc' },
        });
        const countsMap = new Map(stageCounts.map((item) => [item.toStage, item._count.companyId]));
        const results = [];
        for (let i = 0; i < stages.length - 1; i++) {
            const fromStage = stages[i];
            const toStage = stages[i + 1];
            const fromCount = countsMap.get(fromStage) || 0;
            const toCount = countsMap.get(toStage) || 0;
            results.push({
                fromStage,
                toStage,
                fromCount,
                toCount,
                conversionRate: `${fromCount ? Math.round((toCount / fromCount) * 100) : 0}%`,
            });
        }
        const leadCount = countsMap.get(client_1.PipelineStage.LEAD) || 0;
        const doneCount = countsMap.get(client_1.PipelineStage.DONE) || 0;
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
        const companyFilters = { ...filters, stages: undefined };
        const histories = await this.prisma.pipelineStageHistory.findMany({
            where: { company: this.companyWhere(companyFilters, user) },
            select: { companyId: true, fromStage: true, changedAt: true },
            orderBy: [{ companyId: 'asc' }, { changedAt: 'asc' }],
        });
        const durations = new Map();
        const previous = new Map();
        for (const item of histories) {
            const previousDate = previous.get(item.companyId);
            if (previousDate && item.fromStage && (!filters.stages?.length || filters.stages.includes(item.fromStage))) {
                const days = (item.changedAt.getTime() - previousDate.getTime()) / 86_400_000;
                durations.set(item.fromStage, [...(durations.get(item.fromStage) || []), days]);
            }
            previous.set(item.companyId, item.changedAt);
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
        const where = this.companyWhere(filters, user);
        const stageCounts = await this.prisma.company.groupBy({
            by: ['stage'], where, _count: { id: true }, orderBy: { stage: 'asc' },
        });
        const totalCompanies = stageCounts.reduce((sum, item) => sum + item._count.id, 0);
        const lostCount = stageCounts
            .filter((item) => this.isLostStage(item.stage))
            .reduce((sum, item) => sum + item._count.id, 0);
        return {
            stages: stageCounts.map((item) => ({
                stage: item.stage,
                count: item._count.id,
                percentage: totalCompanies ? Math.round((item._count.id / totalCompanies) * 100) : 0,
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
        const companies = await this.prisma.company.findMany({
            where: { AND: [this.companyWhere(filters, user), { ownerId: { not: null } }] },
            select: { ownerId: true, stage: true, owner: { select: { fullName: true, team: true } } },
        });
        const owners = new Map();
        for (const company of companies) {
            if (!company.ownerId)
                continue;
            owners.set(company.ownerId, [...(owners.get(company.ownerId) || []), company]);
        }
        return [...owners.entries()].map(([ownerId, items]) => {
            const doneCompanies = items.filter((item) => item.stage === client_1.PipelineStage.DONE).length;
            const lostCompanies = items.filter((item) => this.isLostStage(item.stage)).length;
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
                stages: Object.values(client_1.PipelineStage).map((stage) => ({
                    stage,
                    count: items.filter((item) => item.stage === stage).length,
                })),
            };
        }).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    async getFilterOptions(user) {
        const companyWhere = this.companyWhere({}, user);
        const [users, companies] = await Promise.all([
            this.prisma.user.findMany({
                where: this.reportUserWhere({}, user),
                select: { id: true, fullName: true, role: true, team: true },
                orderBy: { fullName: 'asc' },
            }),
            this.prisma.company.findMany({
                where: companyWhere,
                select: { industry: true, source: true },
            }),
        ]);
        const unique = (values) => [...new Set(values.filter((value) => Boolean(value)))].sort();
        return {
            users,
            teams: unique(users.map((item) => item.team)),
            industries: unique(companies.map((item) => item.industry)),
            sources: unique(companies.map((item) => item.source)),
            stages: Object.values(client_1.PipelineStage),
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
    isLostStage(stage) {
        return stage === client_1.PipelineStage.LOST || stage === client_1.PipelineStage.NO_RESPONSE;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map