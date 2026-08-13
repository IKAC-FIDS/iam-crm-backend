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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_cache_1 = __importDefault(require("node-cache"));
const prisma_service_1 = require("../prisma/prisma.service");
const entitlement_constants_1 = require("./entitlement.constants");
const cache = new node_cache_1.default({ stdTTL: 300, useClones: false });
let EntitlementService = class EntitlementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    resolveForTenant(tenant, feature, now = new Date()) { return this.resolve(tenant.organizationId, feature, now); }
    async isFeatureEnabled(tenant, feature) { return (await this.resolveForTenant(tenant, feature)).enabled; }
    async resolve(organizationId, feature, now = new Date()) {
        if (!Object.prototype.hasOwnProperty.call(entitlement_constants_1.FEATURE_METADATA, feature))
            return this.denied(feature);
        const organization = await this.prisma.organization.findUnique({ where: { id: organizationId }, select: { status: true, entitlementVersion: true } });
        if (!organization || organization.status !== client_1.OrganizationStatus.ACTIVE)
            return this.denied(feature);
        const key = `tenant-entitlement:${organizationId}:${organization.entitlementVersion}:${feature}`;
        const cached = cache.get(key);
        if (cached && (cached.validUntil === null || now.getTime() < cached.validUntil))
            return cached.result;
        const subscription = await this.prisma.subscription.findFirst({
            where: { organizationId, status: { in: [client_1.SubscriptionStatus.PENDING, client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.SUSPENDED] } },
            include: { plan: { include: { features: { where: { feature } } } } }, orderBy: [{ startAt: 'desc' }, { id: 'desc' }],
        });
        const [override, subscriptionHistory] = await Promise.all([
            this.prisma.organizationEntitlement.findUnique({ where: { organizationId_feature: { organizationId, feature } } }),
            subscription ? Promise.resolve(1) : this.prisma.subscription.count({ where: { organizationId } }),
        ]);
        let result;
        if (!subscription && subscriptionHistory === 0) {
            result = { feature, enabled: override?.state !== client_1.EntitlementOverrideState.DISABLED, source: override ? 'OVERRIDE' : 'LEGACY_COMPATIBILITY', subscriptionId: null, planCode: null };
        }
        else if (!subscription) {
            result = this.denied(feature);
        }
        else if (subscription.status !== client_1.SubscriptionStatus.ACTIVE || subscription.startAt > now) {
            result = this.denied(feature);
        }
        else {
            const inTerm = !subscription.endAt || now < subscription.endAt;
            const inGrace = Boolean(subscription.endAt && subscription.gracePeriodEndAt && now >= subscription.endAt && now < subscription.gracePeriodEndAt);
            if (!inTerm && !inGrace)
                result = this.denied(feature);
            else {
                const baseline = Boolean(subscription.plan.isActive && subscription.plan.features[0]?.enabled);
                const enabled = override ? override.state === client_1.EntitlementOverrideState.ENABLED : baseline;
                result = { feature, enabled, source: override ? 'OVERRIDE' : inGrace ? 'GRACE' : 'PLAN', subscriptionId: subscription.id, planCode: subscription.plan.code };
            }
        }
        const validUntil = subscription?.status === client_1.SubscriptionStatus.ACTIVE
            ? subscription.startAt > now
                ? subscription.startAt.getTime()
                : subscription.endAt && now < subscription.endAt
                    ? subscription.endAt.getTime()
                    : subscription.gracePeriodEndAt && now < subscription.gracePeriodEndAt
                        ? subscription.gracePeriodEndAt.getTime()
                        : null
            : null;
        cache.set(key, { result, validUntil });
        return result;
    }
    async current(tenant) {
        const features = await Promise.all(Object.keys(entitlement_constants_1.FEATURE_METADATA).map((feature) => this.resolveForTenant(tenant, feature)));
        return { organizationId: tenant.organizationId, features };
    }
    denied(feature) { return { feature, enabled: false, source: 'DENIED', subscriptionId: null, planCode: null }; }
};
exports.EntitlementService = EntitlementService;
exports.EntitlementService = EntitlementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EntitlementService);
//# sourceMappingURL=entitlement.service.js.map