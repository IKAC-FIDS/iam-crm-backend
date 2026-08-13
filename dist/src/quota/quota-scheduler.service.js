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
exports.QuotaSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let QuotaSchedulerService = class QuotaSchedulerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async finalizeClosedPeriods(now = new Date()) {
        await this.prisma.usageReservation.updateMany({
            where: {
                status: client_1.UsageReservationStatus.RESERVED,
                expiresAt: { lte: now },
            },
            data: { status: client_1.UsageReservationStatus.EXPIRED, releasedAt: now },
        });
        const pending = await this.prisma.$queryRaw(client_1.Prisma.sql `
      SELECT c."id" FROM "usage_counters" c
      WHERE c."periodEnd" <= ${now}
        AND NOT EXISTS (
          SELECT 1 FROM "usage_snapshots" s
          WHERE s."organizationId" = c."organizationId"
            AND s."metric" = c."metric"
            AND s."periodStart" = c."periodStart"
        )
      ORDER BY c."periodEnd" ASC
      LIMIT 500
    `);
        const closed = pending.length
            ? await this.prisma.usageCounter.findMany({
                where: { id: { in: pending.map((row) => row.id) } },
            })
            : [];
        let created = 0;
        for (const counter of closed) {
            const percentageBasisPts = counter.effectiveHardLimit && counter.effectiveHardLimit > 0n
                ? Number((counter.currentValue * 10000n) / counter.effectiveHardLimit)
                : null;
            const result = await this.prisma.usageSnapshot.createMany({
                data: [
                    {
                        organizationId: counter.organizationId,
                        metric: counter.metric,
                        periodStart: counter.periodStart,
                        periodEnd: counter.periodEnd,
                        finalUsage: counter.currentValue,
                        softLimit: counter.effectiveSoftLimit,
                        hardLimit: counter.effectiveHardLimit,
                        percentageBasisPts,
                        exceeded: counter.effectiveHardLimit !== null &&
                            counter.currentValue > counter.effectiveHardLimit,
                        capturedAt: now,
                    },
                ],
                skipDuplicates: true,
            });
            if (result.count) {
                created += 1;
                await this.prisma.auditLog.create({
                    data: {
                        organizationId: counter.organizationId,
                        entityType: 'quota',
                        entityId: counter.id,
                        action: 'quota.period-snapshotted',
                        metadata: {
                            metric: counter.metric,
                            periodStart: counter.periodStart.toISOString(),
                            periodEnd: counter.periodEnd?.toISOString() ?? null,
                            finalUsage: counter.currentValue.toString(),
                        },
                    },
                });
            }
        }
        return { created };
    }
};
exports.QuotaSchedulerService = QuotaSchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuotaSchedulerService.prototype, "finalizeClosedPeriods", null);
exports.QuotaSchedulerService = QuotaSchedulerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotaSchedulerService);
//# sourceMappingURL=quota-scheduler.service.js.map