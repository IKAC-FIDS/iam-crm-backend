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
exports.QuotaResolverService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let QuotaResolverService = class QuotaResolverService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    resolve(organizationId, metric, now = new Date(), db = this.prisma) {
        return this.resolveWithDb(db, organizationId, metric, now);
    }
    async resolveWithDb(db, organizationId, metric, now) {
        const organization = await db.organization.findUnique({
            where: { id: organizationId },
            select: { status: true, entitlementVersion: true },
        });
        if (!organization || organization.status !== client_1.OrganizationStatus.ACTIVE)
            return this.compatibility(organizationId, metric, 'INACTIVE_ORGANIZATION', organization?.entitlementVersion ?? null);
        const subscription = await db.subscription.findFirst({
            where: {
                organizationId,
                status: {
                    in: [
                        client_1.SubscriptionStatus.PENDING,
                        client_1.SubscriptionStatus.ACTIVE,
                        client_1.SubscriptionStatus.SUSPENDED,
                    ],
                },
            },
            include: { plan: { include: { quotas: { where: { metric } } } } },
            orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
        });
        const override = await db.organizationQuotaOverride.findUnique({
            where: { organizationId_metric: { organizationId, metric } },
        });
        if (!subscription) {
            const history = await db.subscription.count({
                where: { organizationId },
            });
            return this.compatibility(organizationId, metric, history === 0 ? 'LEGACY_COMPATIBILITY' : 'INACTIVE_SUBSCRIPTION', organization.entitlementVersion);
        }
        const inTerm = subscription.status === client_1.SubscriptionStatus.ACTIVE &&
            subscription.startAt <= now &&
            (!subscription.endAt ||
                now < subscription.endAt ||
                Boolean(subscription.gracePeriodEndAt && now < subscription.gracePeriodEndAt));
        if (!inTerm || !subscription.plan.isActive)
            return this.compatibility(organizationId, metric, 'INACTIVE_SUBSCRIPTION', organization.entitlementVersion, subscription.id, subscription.plan.code);
        const baseline = subscription.plan.quotas[0];
        if (!baseline && !override)
            return this.compatibility(organizationId, metric, 'UNCONFIGURED', organization.entitlementVersion, subscription.id, subscription.plan.code);
        const enabled = override?.enabled ?? baseline?.enabled ?? false;
        const unlimited = override?.isUnlimited ?? baseline?.isUnlimited ?? false;
        const softLimit = override?.softLimit ?? baseline?.softLimit ?? null;
        const hardLimit = override?.hardLimit ?? baseline?.hardLimit ?? null;
        const resetPeriod = override?.resetPeriod ?? baseline?.resetPeriod ?? client_1.QuotaResetPeriod.NONE;
        const period = this.period(resetPeriod, now, subscription.startAt, subscription.endAt);
        const state = !enabled
            ? 'DISABLED'
            : unlimited
                ? 'UNLIMITED'
                : hardLimit === null
                    ? 'UNCONFIGURED'
                    : 'ENFORCED';
        return {
            organizationId,
            metric,
            state,
            enabled: state === 'ENFORCED' || state === 'UNLIMITED',
            unlimited: state === 'UNLIMITED',
            softLimit,
            hardLimit,
            resetPeriod,
            ...period,
            planCode: subscription.plan.code,
            subscriptionId: subscription.id,
            entitlementVersion: organization.entitlementVersion,
        };
    }
    period(resetPeriod, now, subscriptionStart, subscriptionEnd) {
        if (resetPeriod === client_1.QuotaResetPeriod.DAILY) {
            const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            return {
                periodStart: start,
                periodEnd: new Date(start.getTime() + 86400000),
            };
        }
        if (resetPeriod === client_1.QuotaResetPeriod.MONTHLY) {
            const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            return {
                periodStart: start,
                periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
            };
        }
        if (resetPeriod === client_1.QuotaResetPeriod.SUBSCRIPTION_TERM && subscriptionStart)
            return {
                periodStart: subscriptionStart,
                periodEnd: subscriptionEnd ?? null,
            };
        return { periodStart: new Date(0), periodEnd: null };
    }
    compatibility(organizationId, metric, state, entitlementVersion, subscriptionId = null, planCode = null) {
        return {
            organizationId,
            metric,
            state,
            enabled: false,
            unlimited: true,
            softLimit: null,
            hardLimit: null,
            resetPeriod: client_1.QuotaResetPeriod.NONE,
            periodStart: new Date(0),
            periodEnd: null,
            planCode,
            subscriptionId,
            entitlementVersion,
        };
    }
};
exports.QuotaResolverService = QuotaResolverService;
exports.QuotaResolverService = QuotaResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuotaResolverService);
//# sourceMappingURL=quota-resolver.service.js.map