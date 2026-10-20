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
var QuotaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const quota_constants_1 = require("./quota.constants");
const quota_exceeded_exception_1 = require("./quota-exceeded.exception");
const quota_resolver_service_1 = require("./quota-resolver.service");
let QuotaService = QuotaService_1 = class QuotaService {
    constructor(prisma, resolver) {
        this.prisma = prisma;
        this.resolver = resolver;
        this.logger = new common_1.Logger(QuotaService_1.name);
    }
    reserveForTenant(tenant, metric, amount, idempotencyKey, now = new Date()) {
        return this.reserve(tenant.organizationId, metric, amount, idempotencyKey, now, tenant.userId, tenant.requestId);
    }
    async reserve(organizationId, metric, amount, idempotencyKey, now = new Date(), actorId, requestId) {
        this.assertAmount(amount, idempotencyKey);
        let violation = null;
        const result = await this.prisma.$transaction(async (tx) => {
            await this.lock(tx, organizationId, metric);
            const quota = await this.resolver.resolve(organizationId, metric, now, tx);
            const counter = await this.counter(tx, quota);
            await tx.usageReservation.updateMany({
                where: {
                    counterId: counter.id,
                    status: client_1.UsageReservationStatus.RESERVED,
                    expiresAt: { lte: now },
                },
                data: { status: client_1.UsageReservationStatus.EXPIRED, releasedAt: now },
            });
            const existing = await tx.usageReservation.findUnique({
                where: {
                    organizationId_metric_idempotencyKey: {
                        organizationId,
                        metric,
                        idempotencyKey,
                    },
                },
            });
            if (existing && existing.amount !== amount)
                throw new Error('Quota idempotency key amount mismatch');
            if (existing &&
                (existing.status === client_1.UsageReservationStatus.RESERVED ||
                    existing.status === client_1.UsageReservationStatus.COMMITTED))
                return {
                    reservationId: existing.id,
                    status: 'ALREADY_RESERVED',
                    quota,
                };
            const reserved = await tx.usageReservation.aggregate({
                where: {
                    counterId: counter.id,
                    status: client_1.UsageReservationStatus.RESERVED,
                },
                _sum: { amount: true },
            });
            const projected = counter.currentValue + (reserved._sum.amount ?? 0n) + amount;
            if (quota.enabled &&
                !quota.unlimited &&
                quota.hardLimit !== null &&
                projected > quota.hardLimit) {
                violation = {
                    current: counter.currentValue + (reserved._sum.amount ?? 0n),
                    limit: quota.hardLimit,
                    resetAt: quota.periodEnd,
                };
                return { reservationId: null, status: 'BYPASSED', quota };
            }
            const reservation = existing
                ? await tx.usageReservation.update({
                    where: { id: existing.id },
                    data: {
                        counterId: counter.id,
                        amount,
                        status: client_1.UsageReservationStatus.RESERVED,
                        expiresAt: new Date(now.getTime() + quota_constants_1.QUOTA_RESERVATION_TTL_MS),
                        committedAt: null,
                        releasedAt: null,
                    },
                })
                : await tx.usageReservation.create({
                    data: {
                        organizationId,
                        counterId: counter.id,
                        metric,
                        idempotencyKey,
                        amount,
                        expiresAt: new Date(now.getTime() + quota_constants_1.QUOTA_RESERVATION_TTL_MS),
                    },
                });
            return {
                reservationId: reservation.id,
                status: 'RESERVED',
                quota,
            };
        });
        if (violation) {
            const failure = violation;
            await this.prisma.auditLog.create({
                data: {
                    organizationId,
                    actorId: actorId ?? null,
                    entityType: 'quota',
                    action: 'quota.hard-limit-exceeded',
                    requestId: requestId ?? null,
                    metadata: {
                        metric,
                        current: failure.current.toString(),
                        requested: amount.toString(),
                        limit: failure.limit.toString(),
                        periodEnd: failure.resetAt?.toISOString() ?? null,
                    },
                },
            });
            this.logger.warn(`Quota exceeded organizationId=${organizationId} metric=${metric}`);
            throw new quota_exceeded_exception_1.QuotaExceededException(metric, failure.current, amount, failure.limit, failure.resetAt);
        }
        return result;
    }
    async commitReservation(reservationId, now = new Date()) {
        if (!reservationId)
            return { committed: false, bypassed: true };
        const result = await this.commitReservations([reservationId], now);
        return result[0] ?? { committed: false, missing: true };
    }
    async commitReservations(reservationIds, now = new Date()) {
        const ids = [
            ...new Set(reservationIds.filter((id) => Boolean(id))),
        ];
        if (!ids.length)
            return [];
        return this.prisma.$transaction(async (tx) => {
            const rows = await tx.usageReservation.findMany({
                where: { id: { in: ids } },
            });
            const lockKeys = [
                ...new Set(rows.map((row) => `${row.organizationId}:${row.metric}`)),
            ].sort();
            for (const key of lockKeys) {
                const separator = key.lastIndexOf(':');
                await this.lock(tx, key.slice(0, separator), key.slice(separator + 1));
            }
            const results = [];
            for (const id of ids) {
                const current = await tx.usageReservation.findUnique({ where: { id } });
                if (!current) {
                    results.push({ committed: false, missing: true });
                    continue;
                }
                if (current.status !== client_1.UsageReservationStatus.RESERVED) {
                    results.push({
                        committed: current.status === client_1.UsageReservationStatus.COMMITTED,
                        idempotent: true,
                    });
                    continue;
                }
                const counter = await tx.usageCounter.update({
                    where: { id: current.counterId },
                    data: {
                        currentValue: { increment: current.amount },
                        version: { increment: 1 },
                    },
                });
                await tx.usageReservation.update({
                    where: { id: current.id },
                    data: { status: client_1.UsageReservationStatus.COMMITTED, committedAt: now },
                });
                await this.thresholds(tx, counter.organizationId, counter.metric, counter.periodStart, counter.currentValue, counter.effectiveHardLimit, now);
                results.push({ committed: true, currentValue: counter.currentValue });
            }
            return results;
        });
    }
    async releaseReservation(reservationId, now = new Date()) {
        if (!reservationId)
            return { released: false, bypassed: true };
        const result = await this.prisma.usageReservation.updateMany({
            where: { id: reservationId, status: client_1.UsageReservationStatus.RESERVED },
            data: { status: client_1.UsageReservationStatus.RELEASED, releasedAt: now },
        });
        return { released: result.count === 1 };
    }
    async consumeEvent(organizationId, metric, amount, idempotencyKey, now = new Date(), actorId, requestId) {
        const reservation = await this.reserve(organizationId, metric, amount, `event:${idempotencyKey}`, now, actorId, requestId);
        if (!reservation.reservationId)
            return { consumed: false, compatibility: true, quota: reservation.quota };
        const recorded = await this.prisma.$transaction(async (tx) => (await tx.usageEvent.createMany({
            data: [
                {
                    organizationId,
                    metric,
                    idempotencyKey,
                    amount,
                    periodStart: reservation.quota.periodStart,
                },
            ],
            skipDuplicates: true,
        })).count === 1);
        if (recorded)
            await this.commitReservation(reservation.reservationId, now);
        else if (reservation.status === 'RESERVED')
            await this.releaseReservation(reservation.reservationId, now);
        return {
            consumed: recorded,
            idempotent: !recorded,
            quota: reservation.quota,
        };
    }
    async summaryForTenant(tenant, now = new Date()) {
        const metrics = Object.values(client_1.QuotaMetric);
        return {
            organizationId: tenant.organizationId,
            generatedAt: now.toISOString(),
            metrics: await Promise.all(metrics.map(async (metric) => {
                const quota = await this.resolver.resolve(tenant.organizationId, metric, now);
                const counter = await this.prisma.usageCounter.findUnique({
                    where: {
                        organizationId_metric_periodStart: {
                            organizationId: tenant.organizationId,
                            metric,
                            periodStart: quota.periodStart,
                        },
                    },
                    select: { currentValue: true },
                });
                const authoritative = counter
                    ? null
                    : await this.authoritativeInventory(this.prisma, tenant.organizationId, metric);
                const current = counter?.currentValue ?? authoritative ?? 0n;
                const basis = quota.hardLimit && quota.hardLimit > 0n
                    ? Number((current * 10000n) / quota.hardLimit)
                    : null;
                return {
                    metric,
                    state: quota.state,
                    current: current.toString(),
                    softLimit: quota.softLimit?.toString() ?? null,
                    hardLimit: quota.hardLimit?.toString() ?? null,
                    resetPeriod: quota.resetPeriod,
                    resetAt: quota.periodEnd?.toISOString() ?? null,
                    threshold: basis === null
                        ? null
                        : basis >= 9000
                            ? 90
                            : basis >= 8000
                                ? 80
                                : null,
                };
            })),
        };
    }
    async counter(tx, quota) {
        const baseline = await this.authoritativeInventory(tx, quota.organizationId, quota.metric);
        return tx.usageCounter.upsert({
            where: {
                organizationId_metric_periodStart: {
                    organizationId: quota.organizationId,
                    metric: quota.metric,
                    periodStart: quota.periodStart,
                },
            },
            create: {
                organizationId: quota.organizationId,
                metric: quota.metric,
                periodStart: quota.periodStart,
                periodEnd: quota.periodEnd,
                currentValue: baseline ?? 0n,
                effectiveSoftLimit: quota.softLimit,
                effectiveHardLimit: quota.hardLimit,
                resetPeriod: quota.resetPeriod,
                configurationState: quota.state,
            },
            update: {
                periodEnd: quota.periodEnd,
                effectiveSoftLimit: quota.softLimit,
                effectiveHardLimit: quota.hardLimit,
                resetPeriod: quota.resetPeriod,
                configurationState: quota.state,
            },
        });
    }
    async synchronizeInventory(organizationId, metric, now = new Date()) {
        return this.prisma.$transaction(async (tx) => {
            await this.lock(tx, organizationId, metric);
            const quota = await this.resolver.resolve(organizationId, metric, now, tx);
            const value = await this.authoritativeInventory(tx, organizationId, metric);
            if (value === null)
                throw new Error(`${metric} is not inventory`);
            return tx.usageCounter.upsert({
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
                    currentValue: value,
                    effectiveSoftLimit: quota.softLimit,
                    effectiveHardLimit: quota.hardLimit,
                    resetPeriod: quota.resetPeriod,
                    configurationState: quota.state,
                },
                update: { currentValue: value, version: { increment: 1 } },
            });
        });
    }
    async authoritativeInventory(tx, organizationId, metric) {
        if (metric === client_1.QuotaMetric.ACTIVE_USERS)
            return BigInt(await tx.organizationMembership.count({
                where: { organizationId, status: 'ACTIVE', user: { isActive: true } },
            }));
        if (metric === client_1.QuotaMetric.COMPANIES)
            return BigInt(await tx.company.count({ where: { organizationId, archivedAt: null } }));
        if (metric === client_1.QuotaMetric.OPPORTUNITIES)
            return BigInt(await tx.opportunity.count({
                where: {
                    organizationId,
                    archivedAt: null,
                    company: { archivedAt: null },
                },
            }));
        if (metric === client_1.QuotaMetric.FILES)
            return BigInt(await tx.fileAttachment.count({
                where: { organizationId, deletedAt: null },
            }));
        if (metric === client_1.QuotaMetric.STORAGE_BYTES) {
            const total = await tx.fileAttachment.aggregate({
                where: { organizationId, deletedAt: null },
                _sum: { sizeBytes: true },
            });
            return BigInt(total._sum.sizeBytes ?? 0);
        }
        return null;
    }
    async thresholds(tx, organizationId, metric, periodStart, usage, limit, now) {
        if (!limit || limit <= 0n)
            return;
        for (const threshold of quota_constants_1.QUOTA_THRESHOLDS)
            if (usage * 100n >= limit * BigInt(threshold)) {
                const created = await tx.quotaThresholdEvent.createMany({
                    data: [
                        {
                            organizationId,
                            metric,
                            periodStart,
                            threshold,
                            usageValue: usage,
                            limitValue: limit,
                            createdAt: now,
                        },
                    ],
                    skipDuplicates: true,
                });
                if (created.count)
                    await tx.auditLog.create({
                        data: {
                            organizationId,
                            entityType: 'quota',
                            action: `quota.threshold-${threshold}`,
                            metadata: {
                                metric,
                                usage: usage.toString(),
                                limit: limit.toString(),
                                threshold,
                                periodStart: periodStart.toISOString(),
                            },
                        },
                    });
            }
    }
    lock(tx, organizationId, metric) {
        return tx.$queryRaw(client_1.Prisma.sql `SELECT CAST(pg_advisory_xact_lock(hashtext(${`quota:${organizationId}:${metric}`})) AS TEXT) AS "lockResult"`);
    }
    assertAmount(amount, idempotencyKey) {
        if (amount <= 0n)
            throw new Error('Quota amount must be positive');
        if (!idempotencyKey.trim())
            throw new Error('Quota idempotency key is required');
    }
};
exports.QuotaService = QuotaService;
exports.QuotaService = QuotaService = QuotaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        quota_resolver_service_1.QuotaResolverService])
], QuotaService);
//# sourceMappingURL=quota.service.js.map