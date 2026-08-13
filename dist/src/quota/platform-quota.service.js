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
exports.PlatformQuotaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlatformQuotaService = class PlatformQuotaService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async planQuotas(planId) {
        return (await this.prisma.planQuota.findMany({
            where: { planId },
            orderBy: { metric: 'asc' },
        })).map((row) => this.present(row));
    }
    async organizationOverrides(organizationId) {
        return (await this.prisma.organizationQuotaOverride.findMany({
            where: { organizationId },
            orderBy: { metric: 'asc' },
        })).map((row) => this.present(row));
    }
    async setPlanQuota(planId, metric, dto, platform) {
        const limits = this.limits(dto);
        return this.prisma.$transaction(async (tx) => {
            if (!(await tx.plan.findUnique({
                where: { id: planId },
                select: { id: true },
            })))
                throw new common_1.NotFoundException('Plan not found');
            const before = await tx.planQuota.findUnique({
                where: { planId_metric: { planId, metric } },
            });
            const item = await tx.planQuota.upsert({
                where: { planId_metric: { planId, metric } },
                create: { planId, metric, ...dto, ...limits },
                update: { ...dto, ...limits },
            });
            await tx.plan.update({
                where: { id: planId },
                data: { revision: { increment: 1 } },
            });
            const organizations = await tx.subscription.findMany({
                where: { planId, status: { in: ['PENDING', 'ACTIVE', 'SUSPENDED'] } },
                distinct: ['organizationId'],
                select: { organizationId: true },
            });
            if (organizations.length)
                await tx.organization.updateMany({
                    where: { id: { in: organizations.map((row) => row.organizationId) } },
                    data: { entitlementVersion: { increment: 1 } },
                });
            await this.audit(tx, platform, 'quota.plan-changed', item.id, null, {
                planId,
                metric,
                before: this.json(before),
                after: this.json(item),
            });
            return this.present(item);
        });
    }
    async setOverride(organizationId, metric, dto, platform) {
        const limits = this.limits(dto);
        return this.prisma.$transaction(async (tx) => {
            if (!(await tx.organization.findUnique({
                where: { id: organizationId },
                select: { id: true },
            })))
                throw new common_1.NotFoundException('Organization not found');
            const before = await tx.organizationQuotaOverride.findUnique({
                where: { organizationId_metric: { organizationId, metric } },
            });
            const item = await tx.organizationQuotaOverride.upsert({
                where: { organizationId_metric: { organizationId, metric } },
                create: {
                    organizationId,
                    metric,
                    ...dto,
                    ...limits,
                    createdById: platform.userId,
                },
                update: { ...dto, ...limits, createdById: platform.userId },
            });
            await tx.organization.update({
                where: { id: organizationId },
                data: { entitlementVersion: { increment: 1 } },
            });
            await this.audit(tx, platform, before ? 'quota.override-changed' : 'quota.override-created', item.id, organizationId, { metric, before: this.json(before), after: this.json(item) });
            return this.present(item);
        });
    }
    async removeOverride(organizationId, metric, platform) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.organizationQuotaOverride.findUnique({
                where: { organizationId_metric: { organizationId, metric } },
            });
            if (!before)
                throw new common_1.NotFoundException('Quota override not found');
            await tx.organizationQuotaOverride.delete({
                where: { organizationId_metric: { organizationId, metric } },
            });
            await tx.organization.update({
                where: { id: organizationId },
                data: { entitlementVersion: { increment: 1 } },
            });
            await this.audit(tx, platform, 'quota.override-removed', before.id, organizationId, { metric, before: this.json(before) });
            return { removed: true };
        });
    }
    limits(dto) {
        const softLimit = dto.softLimit == null ? null : BigInt(dto.softLimit), hardLimit = dto.hardLimit == null ? null : BigInt(dto.hardLimit);
        if (softLimit !== null && hardLimit !== null && softLimit > hardLimit)
            throw new common_1.BadRequestException('softLimit must not exceed hardLimit');
        if (dto.isUnlimited === true && (softLimit !== null || hardLimit !== null))
            throw new common_1.BadRequestException('Unlimited quota cannot define limits');
        if (dto.enabled === true && dto.isUnlimited === false && hardLimit === null)
            throw new common_1.BadRequestException('Enabled finite quota requires hardLimit');
        return { softLimit, hardLimit };
    }
    audit(tx, platform, action, entityId, organizationId, metadata) {
        return tx.auditLog.create({
            data: {
                actorId: platform.userId,
                actorType: 'PLATFORM_ADMIN',
                scope: 'PLATFORM',
                source: 'PLATFORM',
                result: 'SUCCESS',
                organizationId,
                entityType: 'quota',
                entityId,
                action,
                requestId: platform.requestId ?? null,
                metadata,
            },
        });
    }
    json(value) {
        return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item));
    }
    present(value) {
        return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item));
    }
};
exports.PlatformQuotaService = PlatformQuotaService;
exports.PlatformQuotaService = PlatformQuotaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformQuotaService);
//# sourceMappingURL=platform-quota.service.js.map