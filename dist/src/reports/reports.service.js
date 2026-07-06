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
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConversionRates() {
        const stages = Object.values(client_1.PipelineStage);
        const stageCounts = await this.prisma.pipelineStageHistory.groupBy({
            by: ['toStage'],
            _count: { companyId: true },
            orderBy: { toStage: 'asc' },
        });
        const countsMap = new Map();
        stageCounts.forEach((item) => {
            countsMap.set(item.toStage, item._count.companyId);
        });
        const results = [];
        for (let i = 0; i < stages.length - 1; i++) {
            const currentStage = stages[i];
            const nextStage = stages[i + 1];
            const currentCount = countsMap.get(currentStage) || 0;
            const nextCount = countsMap.get(nextStage) || 0;
            const conversionRate = currentCount > 0
                ? Math.round((nextCount / currentCount) * 100)
                : 0;
            results.push({
                fromStage: currentStage,
                toStage: nextStage,
                fromCount: currentCount,
                toCount: nextCount,
                conversionRate: `${conversionRate}%`,
            });
        }
        const leadCount = countsMap.get(client_1.PipelineStage.LEAD) || 0;
        const doneCount = countsMap.get(client_1.PipelineStage.DONE) || 0;
        return {
            stages: results,
            summary: {
                totalCompanies: leadCount,
                completedCompanies: doneCount,
                overallConversionRate: leadCount > 0
                    ? Math.round((doneCount / leadCount) * 100)
                    : 0,
            },
        };
    }
    async getAverageStageDuration() {
        const results = await this.prisma.$queryRaw `
      WITH stage_durations AS (
        SELECT 
          company_id,
          from_stage,
          to_stage,
          changed_at,
          LAG(changed_at) OVER (PARTITION BY company_id ORDER BY changed_at) as prev_changed_at
        FROM pipeline_stage_history
        WHERE from_stage IS NOT NULL
      ),
      durations AS (
        SELECT 
          from_stage,
          EXTRACT(EPOCH FROM (changed_at - prev_changed_at)) / 86400 AS duration_days
        FROM stage_durations
        WHERE prev_changed_at IS NOT NULL
      )
      SELECT 
        from_stage as stage,
        COUNT(*)::int as sample_count,
        ROUND(AVG(duration_days)::numeric, 2) as avg_duration_days,
        ROUND(MIN(duration_days)::numeric, 2) as min_duration_days,
        ROUND(MAX(duration_days)::numeric, 2) as max_duration_days
      FROM durations
      GROUP BY from_stage
      ORDER BY from_stage;
    `;
        return results;
    }
    async getPipelineSummary() {
        const stageCounts = await this.prisma.company.groupBy({
            by: ['stage'],
            _count: { id: true },
            orderBy: { stage: 'asc' },
        });
        const totalCompanies = await this.prisma.company.count();
        const lostCount = await this.prisma.company.count({
            where: {
                stage: { in: [client_1.PipelineStage.LOST, client_1.PipelineStage.NO_RESPONSE] },
            },
        });
        const stages = stageCounts.map((item) => ({
            stage: item.stage,
            count: item._count.id,
            percentage: totalCompanies > 0
                ? Math.round((item._count.id / totalCompanies) * 100)
                : 0,
        }));
        return {
            stages,
            summary: {
                totalCompanies,
                activeCompanies: totalCompanies - lostCount,
                lostCompanies: lostCount,
                lostRate: totalCompanies > 0
                    ? Math.round((lostCount / totalCompanies) * 100)
                    : 0,
            },
        };
    }
    async getActivityReport(startDate, endDate) {
        const activities = await this.prisma.activity.groupBy({
            by: ['type'],
            where: {
                occurredAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _count: { id: true },
            orderBy: { type: 'asc' },
        });
        const totalActivities = activities.reduce((sum, item) => sum + item._count.id, 0);
        return {
            startDate,
            endDate,
            totalActivities,
            breakdown: activities.map((item) => ({
                type: item.type,
                count: item._count.id,
                percentage: totalActivities > 0
                    ? Math.round((item._count.id / totalActivities) * 100)
                    : 0,
            })),
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map