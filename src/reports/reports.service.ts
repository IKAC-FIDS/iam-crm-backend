import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineStage } from '@prisma/client';

// تعریف نوع برای خروجی‌ها
interface StageConversion {
  fromStage: string;
  toStage: string;
  fromCount: number;
  toCount: number;
  conversionRate: string;
}

interface DurationResult {
  stage: string;
  sample_count: number;
  avg_duration_days: number;
  min_duration_days: number;
  max_duration_days: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // ۱. نرخ تبدیل بین مراحل (اصلاح شده)
  // ============================================================
  async getConversionRates() {
    const stages = Object.values(PipelineStage);
    
    const stageCounts = await this.prisma.pipelineStageHistory.groupBy({
      by: ['toStage'],
      _count: { companyId: true },
      orderBy: { toStage: 'asc' },
    });

    const countsMap = new Map<string, number>();
    stageCounts.forEach((item) => {
      countsMap.set(item.toStage, item._count.companyId);
    });

    const results: StageConversion[] = [];
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

    // ✅ استفاده از مقادیر پیش‌فرض برای جلوگیری از undefined
    const leadCount = countsMap.get(PipelineStage.LEAD) || 0;
    const doneCount = countsMap.get(PipelineStage.DONE) || 0;

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

  // ============================================================
  // ۲. میانگین زمان ماندگاری در هر مرحله
  // ============================================================
  async getAverageStageDuration(): Promise<DurationResult[]> {
    const results = await this.prisma.$queryRaw`
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

    return results as any[];
  }

  // ============================================================
  // ۳. گزارش جامع پایپ‌لاین
  // ============================================================
  async getPipelineSummary() {
    const stageCounts = await this.prisma.company.groupBy({
      by: ['stage'],
      _count: { id: true },
      orderBy: { stage: 'asc' },
    });

    const totalCompanies = await this.prisma.company.count();
    const lostCount = await this.prisma.company.count({
      where: {
        stage: { in: [PipelineStage.LOST, PipelineStage.NO_RESPONSE] },
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

  // ============================================================
  // ۴. گزارش فعالیت‌ها در بازه زمانی
  // ============================================================
  async getActivityReport(startDate: Date, endDate: Date) {
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

    const totalActivities = activities.reduce(
      (sum, item) => sum + item._count.id,
      0,
    );

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
}