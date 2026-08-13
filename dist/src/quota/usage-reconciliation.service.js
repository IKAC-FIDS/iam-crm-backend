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
exports.UsageReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const quota_constants_1 = require("./quota.constants");
const quota_resolver_service_1 = require("./quota-resolver.service");
let UsageReconciliationService = class UsageReconciliationService {
    constructor(prisma, resolver) {
        this.prisma = prisma;
        this.resolver = resolver;
    }
    async authoritative(organizationId, metric) {
        switch (metric) {
            case client_1.QuotaMetric.ACTIVE_USERS:
                return BigInt(await this.prisma.organizationMembership.count({
                    where: {
                        organizationId,
                        status: 'ACTIVE',
                        user: { isActive: true },
                    },
                }));
            case client_1.QuotaMetric.COMPANIES:
                return BigInt(await this.prisma.company.count({
                    where: { organizationId, archivedAt: null },
                }));
            case client_1.QuotaMetric.OPPORTUNITIES:
                return BigInt(await this.prisma.opportunity.count({
                    where: {
                        organizationId,
                        archivedAt: null,
                        company: { archivedAt: null },
                    },
                }));
            case client_1.QuotaMetric.FILES:
                return BigInt(await this.prisma.fileAttachment.count({
                    where: { organizationId, deletedAt: null },
                }));
            case client_1.QuotaMetric.STORAGE_BYTES: {
                const total = await this.prisma.fileAttachment.aggregate({
                    where: { organizationId, deletedAt: null },
                    _sum: { sizeBytes: true },
                });
                return BigInt(total._sum.sizeBytes ?? 0);
            }
            default:
                throw new Error(`${metric} is not an inventory metric`);
        }
    }
    async reconcile(organizationId, apply, now = new Date()) {
        const results = [];
        for (const metric of quota_constants_1.INVENTORY_METRICS) {
            const quota = await this.resolver.resolve(organizationId, metric, now);
            const authoritative = await this.authoritative(organizationId, metric);
            const current = await this.prisma.usageCounter.findUnique({
                where: {
                    organizationId_metric_periodStart: {
                        organizationId,
                        metric,
                        periodStart: quota.periodStart,
                    },
                },
            });
            const stored = current?.currentValue ?? 0n;
            if (apply && (!current || stored !== authoritative))
                await this.prisma.$transaction(async (tx) => {
                    await tx.$queryRaw(client_1.Prisma.sql `SELECT CAST(pg_advisory_xact_lock(hashtext(${`quota:${organizationId}:${metric}`})) AS TEXT) AS "lockResult"`);
                    const row = await tx.usageCounter.upsert({
                        where: {
                            organizationId_metric_periodStart: {
                                organizationId,
                                metric,
                                periodStart: quota.periodStart,
                            },
                        },
                        create: {
                            organizationId,
                            metric,
                            periodStart: quota.periodStart,
                            periodEnd: quota.periodEnd,
                            currentValue: authoritative,
                            effectiveSoftLimit: quota.softLimit,
                            effectiveHardLimit: quota.hardLimit,
                            resetPeriod: quota.resetPeriod,
                            configurationState: quota.state,
                        },
                        update: { currentValue: authoritative, version: { increment: 1 } },
                    });
                    await tx.auditLog.create({
                        data: {
                            organizationId,
                            entityType: 'quota',
                            entityId: row.id,
                            action: current
                                ? 'quota.reconciliation-adjusted'
                                : 'quota.baseline-created',
                            before: { usage: stored.toString() },
                            after: { usage: authoritative.toString() },
                            metadata: {
                                metric,
                                periodStart: quota.periodStart.toISOString(),
                            },
                        },
                    });
                });
            results.push({
                metric,
                stored: stored.toString(),
                authoritative: authoritative.toString(),
                delta: (authoritative - stored).toString(),
                changed: !current || stored !== authoritative,
            });
        }
        return { organizationId, mode: apply ? 'apply' : 'dry-run', results };
    }
};
exports.UsageReconciliationService = UsageReconciliationService;
exports.UsageReconciliationService = UsageReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        quota_resolver_service_1.QuotaResolverService])
], UsageReconciliationService);
//# sourceMappingURL=usage-reconciliation.service.js.map