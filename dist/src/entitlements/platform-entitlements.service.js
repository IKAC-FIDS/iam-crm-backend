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
exports.PlatformEntitlementsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const TRANSITIONS = {
    PENDING: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.CANCELLED],
    ACTIVE: [client_1.SubscriptionStatus.SUSPENDED, client_1.SubscriptionStatus.CANCELLED, client_1.SubscriptionStatus.EXPIRED],
    SUSPENDED: [client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.CANCELLED, client_1.SubscriptionStatus.EXPIRED],
    CANCELLED: [], EXPIRED: [],
};
let PlatformEntitlementsService = class PlatformEntitlementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    plans() { return this.prisma.plan.findMany({ include: { features: true, _count: { select: { subscriptions: true } } }, orderBy: { code: 'asc' } }); }
    async createPlan(dto, platform) {
        try {
            return await this.prisma.$transaction(async (tx) => { const plan = await tx.plan.create({ data: dto }); await this.audit(tx, platform, 'plan.created', plan.id, null, plan); return plan; });
        }
        catch (error) {
            this.conflict(error, 'Plan code already exists');
        }
    }
    async updatePlan(id, dto, platform) {
        return this.prisma.$transaction(async (tx) => { const current = await tx.plan.findUnique({ where: { id } }); if (!current)
            throw new common_1.NotFoundException('Plan not found'); const plan = await tx.plan.update({ where: { id }, data: { ...dto, revision: { increment: 1 } } }); await this.bumpPlanSubscribers(tx, id); await this.audit(tx, platform, dto.isActive === false ? 'plan.deactivated' : 'plan.updated', id, current, plan); return plan; });
    }
    async setFeature(planId, feature, dto, platform) {
        return this.prisma.$transaction(async (tx) => { const plan = await tx.plan.findUnique({ where: { id: planId } }); if (!plan)
            throw new common_1.NotFoundException('Plan not found'); const before = await tx.planFeature.findUnique({ where: { planId_feature: { planId, feature } } }); const item = await tx.planFeature.upsert({ where: { planId_feature: { planId, feature } }, create: { planId, feature, enabled: dto.enabled, value: dto.value }, update: { enabled: dto.enabled, value: dto.value } }); await tx.plan.update({ where: { id: planId }, data: { revision: { increment: 1 } } }); await this.bumpPlanSubscribers(tx, planId); await this.audit(tx, platform, 'plan-feature.changed', item.id, before, item, { planId, feature }); return item; });
    }
    async currentSubscription(organizationId) { return this.prisma.subscription.findFirst({ where: { organizationId, status: { in: [client_1.SubscriptionStatus.PENDING, client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.SUSPENDED] } }, include: { plan: { include: { features: true } } } }); }
    async createSubscription(organizationId, dto, platform) {
        const startAt = new Date(dto.startAt), endAt = dto.endAt ? new Date(dto.endAt) : null, grace = dto.gracePeriodEndAt ? new Date(dto.gracePeriodEndAt) : null;
        const initialStatus = dto.status ?? client_1.SubscriptionStatus.PENDING;
        const allowedInitialStatuses = [client_1.SubscriptionStatus.PENDING, client_1.SubscriptionStatus.ACTIVE];
        if (!allowedInitialStatuses.includes(initialStatus))
            throw new common_1.BadRequestException('New subscriptions must start PENDING or ACTIVE');
        if (endAt && endAt <= startAt)
            throw new common_1.BadRequestException('endAt must be after startAt');
        if (grace && (!endAt || grace <= endAt))
            throw new common_1.BadRequestException('gracePeriodEndAt must be after endAt');
        if (dto.type === 'TRIAL' && !endAt)
            throw new common_1.BadRequestException('Trial subscriptions require endAt');
        return this.prisma.$transaction(async (tx) => {
            await this.lock(tx, organizationId);
            const [organization, plan, current] = await Promise.all([tx.organization.findUnique({ where: { id: organizationId }, select: { id: true } }), tx.plan.findFirst({ where: { id: dto.planId, isActive: true } }), tx.subscription.findFirst({ where: { organizationId, status: { in: [client_1.SubscriptionStatus.PENDING, client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.SUSPENDED] } } })]);
            if (!organization)
                throw new common_1.NotFoundException('Organization not found');
            if (!plan)
                throw new common_1.BadRequestException('Plan is missing or inactive');
            if (current)
                throw new common_1.ConflictException('Organization already has a current subscription');
            const subscription = await tx.subscription.create({ data: { organizationId, planId: plan.id, type: dto.type, status: initialStatus, startAt, endAt, gracePeriodEndAt: grace, contractReference: dto.contractReference, internalNote: dto.internalNote, createdById: platform.userId } });
            await this.bump(tx, organizationId);
            await this.audit(tx, platform, 'subscription.created', subscription.id, null, this.safeSubscription(subscription), { targetOrganizationId: organizationId });
            return this.safeSubscription(subscription);
        });
    }
    async updateSubscription(id, dto, platform) {
        return this.prisma.$transaction(async (tx) => {
            const current = await tx.subscription.findUnique({ where: { id } });
            if (!current)
                throw new common_1.NotFoundException('Subscription not found');
            await this.lock(tx, current.organizationId);
            const startAt = dto.startAt ? new Date(dto.startAt) : current.startAt, endAt = dto.endAt === null ? null : dto.endAt ? new Date(dto.endAt) : current.endAt, grace = dto.gracePeriodEndAt === null ? null : dto.gracePeriodEndAt ? new Date(dto.gracePeriodEndAt) : current.gracePeriodEndAt;
            if (endAt && endAt <= startAt)
                throw new common_1.BadRequestException('endAt must be after startAt');
            if (grace && (!endAt || grace <= endAt))
                throw new common_1.BadRequestException('gracePeriodEndAt must be after endAt');
            if (current.type === 'TRIAL' && !endAt)
                throw new common_1.BadRequestException('Trial subscriptions require endAt');
            if (dto.planId && !await tx.plan.findFirst({ where: { id: dto.planId, isActive: true }, select: { id: true } }))
                throw new common_1.BadRequestException('Plan is missing or inactive');
            const updated = await tx.subscription.update({ where: { id }, data: { ...(dto.planId && { planId: dto.planId }), startAt, endAt, gracePeriodEndAt: grace, ...(dto.contractReference !== undefined && { contractReference: dto.contractReference }), ...(dto.internalNote !== undefined && { internalNote: dto.internalNote }) } });
            await this.bump(tx, current.organizationId);
            await this.audit(tx, platform, 'subscription.updated', id, this.safeSubscription(current), this.safeSubscription(updated), { targetOrganizationId: current.organizationId });
            return this.safeSubscription(updated);
        });
    }
    async transition(id, dto, platform) {
        return this.prisma.$transaction(async (tx) => { const current = await tx.subscription.findUnique({ where: { id } }); if (!current)
            throw new common_1.NotFoundException('Subscription not found'); await this.lock(tx, current.organizationId); if (current.status === dto.status)
            return this.safeSubscription(current); if (!TRANSITIONS[current.status].includes(dto.status))
            throw new common_1.ConflictException(`Invalid subscription transition: ${current.status} -> ${dto.status}`); const updated = await tx.subscription.update({ where: { id }, data: { status: dto.status } }); await this.bump(tx, current.organizationId); await this.audit(tx, platform, `subscription.${dto.status.toLowerCase()}`, id, this.safeSubscription(current), this.safeSubscription(updated), { targetOrganizationId: current.organizationId }); return this.safeSubscription(updated); });
    }
    listOverrides(organizationId) { return this.prisma.organizationEntitlement.findMany({ where: { organizationId }, orderBy: { feature: 'asc' } }); }
    async setOverride(organizationId, feature, dto, platform) {
        return this.prisma.$transaction(async (tx) => { if (!await tx.organization.findUnique({ where: { id: organizationId }, select: { id: true } }))
            throw new common_1.NotFoundException('Organization not found'); const before = await tx.organizationEntitlement.findUnique({ where: { organizationId_feature: { organizationId, feature } } }); const item = await tx.organizationEntitlement.upsert({ where: { organizationId_feature: { organizationId, feature } }, create: { organizationId, feature, state: dto.state, reason: dto.reason, createdById: platform.userId }, update: { state: dto.state, reason: dto.reason, createdById: platform.userId } }); await this.bump(tx, organizationId); await this.audit(tx, platform, before ? 'entitlement-override.updated' : 'entitlement-override.created', item.id, before, item, { targetOrganizationId: organizationId, feature }); return item; });
    }
    async removeOverride(organizationId, feature, platform) { return this.prisma.$transaction(async (tx) => { const current = await tx.organizationEntitlement.findUnique({ where: { organizationId_feature: { organizationId, feature } } }); if (!current)
        throw new common_1.NotFoundException('Entitlement override not found'); await tx.organizationEntitlement.delete({ where: { organizationId_feature: { organizationId, feature } } }); await this.bump(tx, organizationId); await this.audit(tx, platform, 'entitlement-override.removed', current.id, current, null, { targetOrganizationId: organizationId, feature }); return { removed: true }; }); }
    lock(tx, organizationId) { return tx.$queryRaw(client_1.Prisma.sql `SELECT CAST(pg_advisory_xact_lock(hashtext(${`subscription:${organizationId}`})) AS TEXT) AS "lockResult"`); }
    bump(tx, organizationId) { return tx.organization.update({ where: { id: organizationId }, data: { entitlementVersion: { increment: 1 } } }); }
    async bumpPlanSubscribers(tx, planId) { const rows = await tx.subscription.findMany({ where: { planId, status: { in: [client_1.SubscriptionStatus.PENDING, client_1.SubscriptionStatus.ACTIVE, client_1.SubscriptionStatus.SUSPENDED] } }, distinct: ['organizationId'], select: { organizationId: true } }); if (rows.length)
        await tx.organization.updateMany({ where: { id: { in: rows.map((row) => row.organizationId) } }, data: { entitlementVersion: { increment: 1 } } }); }
    audit(tx, platform, action, entityId, before, after, metadata) { return tx.auditLog.create({ data: { actorId: platform.userId, organizationId: null, entityType: 'commercial-entitlement', entityId, action, before: before ?? undefined, after: after ?? undefined, metadata: { platformRole: platform.platformRole, ...metadata }, requestId: platform.requestId ?? null } }); }
    safeSubscription(value) { const { internalNote: _internalNote, ...safe } = value; return safe; }
    conflict(error, message) { if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new common_1.ConflictException(message); throw error; }
};
exports.PlatformEntitlementsService = PlatformEntitlementsService;
exports.PlatformEntitlementsService = PlatformEntitlementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformEntitlementsService);
//# sourceMappingURL=platform-entitlements.service.js.map