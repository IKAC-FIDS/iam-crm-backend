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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const LIFECYCLE_TRANSITIONS = {
    PENDING_SETUP: [client_1.OrganizationStatus.ACTIVE, client_1.OrganizationStatus.ARCHIVED],
    ACTIVE: [client_1.OrganizationStatus.SUSPENDED, client_1.OrganizationStatus.ARCHIVED],
    SUSPENDED: [client_1.OrganizationStatus.ACTIVE, client_1.OrganizationStatus.ARCHIVED],
    ARCHIVED: [],
};
const organizationSelect = {
    id: true,
    code: true,
    name: true,
    status: true,
    onboardingStatus: true,
    onboardingStartedAt: true,
    onboardingCompletedAt: true,
    onboardingLastAttemptAt: true,
    onboardingFailureCode: true,
    onboardingFailureMessage: true,
    timezone: true,
    locale: true,
    settings: true,
    createdAt: true,
    updatedAt: true,
};
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async current(user) {
        const organization = await this.prisma.organization.findUnique({
            where: { id: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            select: organizationSelect,
        });
        if (!organization)
            throw new common_1.NotFoundException('Organization not found');
        return organization;
    }
    async findAll(query, platform) {
        void platform;
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim();
        const where = {
            ...(query.status && { status: query.status }),
            ...(search && {
                OR: [
                    { code: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                select: organizationSelect,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.organization.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    async findOne(id, platform) {
        void platform;
        const organization = await this.prisma.organization.findUnique({ where: { id }, select: organizationSelect });
        if (!organization)
            throw new common_1.NotFoundException('Organization not found');
        return organization;
    }
    async onboarding(id, platform) {
        const organization = await this.findOne(id, platform);
        const [owners, teams] = await Promise.all([
            this.prisma.organizationMembership.count({
                where: { organizationId: id, isTenantOwner: true, status: client_1.OrganizationMembershipStatus.ACTIVE, user: { isActive: true } },
            }),
            this.prisma.team.count({ where: { organizationId: id, isActive: true } }),
        ]);
        return { organization, readiness: { activeTenantOwners: owners, activeTeams: teams, ready: organization.onboardingStatus === client_1.OrganizationOnboardingStatus.READY && owners > 0 && teams > 0 } };
    }
    async create(dto, platform) {
        const code = this.normalizeCode(dto.code);
        try {
            return await this.prisma.$transaction(async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        code,
                        name: this.requiredText(dto.name, 'Organization name is required'),
                        status: client_1.OrganizationStatus.PENDING_SETUP,
                        onboardingStatus: client_1.OrganizationOnboardingStatus.NOT_STARTED,
                        timezone: dto.timezone?.trim() || 'Asia/Tehran',
                        locale: dto.locale?.trim() || 'fa-IR',
                        settings: dto.settings,
                    },
                    select: organizationSelect,
                });
                await this.audit(tx, platform, organization.id, 'TENANT_CREATED', null, organization);
                return organization;
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Organization code already exists');
            }
            throw error;
        }
    }
    async update(id, dto, platform) {
        const current = await this.findOne(id, platform);
        const data = {};
        if (dto.code !== undefined)
            data.code = this.normalizeCode(dto.code);
        if (dto.name !== undefined)
            data.name = this.requiredText(dto.name, 'Organization name is required');
        if (dto.timezone !== undefined)
            data.timezone = dto.timezone.trim() || 'Asia/Tehran';
        if (dto.locale !== undefined)
            data.locale = dto.locale.trim() || 'fa-IR';
        if (dto.settings !== undefined)
            data.settings = dto.settings;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const updated = await tx.organization.update({ where: { id }, data, select: organizationSelect });
                await this.audit(tx, platform, id, 'organization.updated', current, updated);
                return updated;
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.ConflictException('Organization code already exists');
            }
            throw error;
        }
    }
    async provision(id, dto, platform) {
        const attemptAt = new Date();
        try {
            return await this.prisma.$transaction(async (tx) => {
                await this.lock(tx, id);
                const organization = await this.requiredOrganization(tx, id);
                if (organization.status !== client_1.OrganizationStatus.PENDING_SETUP) {
                    throw new common_1.ConflictException('Only a pending Organization can be provisioned');
                }
                const owner = await tx.user.findUnique({ where: { id: dto.ownerUserId }, select: { id: true, isActive: true } });
                if (!owner?.isActive)
                    throw new common_1.BadRequestException('Tenant Owner must be an active User');
                await tx.organization.update({
                    where: { id },
                    data: {
                        onboardingStatus: client_1.OrganizationOnboardingStatus.IN_PROGRESS,
                        onboardingStartedAt: organization.onboardingStartedAt ?? attemptAt,
                        onboardingLastAttemptAt: attemptAt,
                        onboardingFailureCode: null,
                        onboardingFailureMessage: null,
                    },
                });
                await this.audit(tx, platform, id, 'TENANT_PROVISIONING_STARTED', organization, { onboardingStatus: 'IN_PROGRESS' });
                const teamCode = this.normalizeCode(dto.defaultTeamCode || 'default');
                const team = await tx.team.upsert({
                    where: { organizationId_code: { organizationId: id, code: teamCode } },
                    create: { organizationId: id, code: teamCode, name: this.requiredText(dto.defaultTeamName || 'Default Team', 'Default team name is required'), managerId: owner.id },
                    update: {},
                });
                const membership = await tx.organizationMembership.upsert({
                    where: { userId_organizationId: { userId: owner.id, organizationId: id } },
                    create: { userId: owner.id, organizationId: id, teamId: team.id, status: client_1.OrganizationMembershipStatus.ACTIVE, isTenantOwner: true, joinedAt: attemptAt, isDefault: false },
                    update: { status: client_1.OrganizationMembershipStatus.ACTIVE, isTenantOwner: true, joinedAt: attemptAt, teamId: team.id, suspendedAt: null },
                });
                const ready = await tx.organization.update({
                    where: { id },
                    data: { onboardingStatus: client_1.OrganizationOnboardingStatus.READY, onboardingCompletedAt: new Date(), onboardingFailureCode: null, onboardingFailureMessage: null },
                    select: organizationSelect,
                });
                await this.audit(tx, platform, id, 'TENANT_OWNER_ASSIGNED', null, { membershipId: membership.id, ownerUserId: owner.id });
                await this.audit(tx, platform, id, 'TENANT_PROVISIONING_COMPLETED', { onboardingStatus: 'IN_PROGRESS' }, ready);
                return { organization: ready, ownerMembershipId: membership.id, defaultTeamId: team.id };
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            const message = error instanceof Error ? error.message.slice(0, 300) : 'Provisioning failed';
            await this.recordProvisioningFailure(id, platform, attemptAt, message);
            throw error;
        }
    }
    activate(id, platform) {
        return this.transition(id, client_1.OrganizationStatus.ACTIVE, 'TENANT_ACTIVATED', platform);
    }
    suspend(id, platform) {
        return this.transition(id, client_1.OrganizationStatus.SUSPENDED, 'TENANT_SUSPENDED', platform);
    }
    resume(id, platform) {
        return this.transition(id, client_1.OrganizationStatus.ACTIVE, 'TENANT_RESUMED', platform);
    }
    archive(id, platform) {
        return this.transition(id, client_1.OrganizationStatus.ARCHIVED, 'TENANT_ARCHIVED', platform);
    }
    async transition(id, target, action, platform) {
        return this.prisma.$transaction(async (tx) => {
            await this.lock(tx, id);
            const current = await this.requiredOrganization(tx, id);
            if (current.status === target)
                return current;
            if (!LIFECYCLE_TRANSITIONS[current.status].includes(target)) {
                throw new common_1.ConflictException(`Invalid Organization lifecycle transition: ${current.status} -> ${target}`);
            }
            if (target === client_1.OrganizationStatus.ACTIVE)
                await this.assertActivationReady(tx, current);
            const updated = await tx.organization.update({ where: { id }, data: { status: target }, select: organizationSelect });
            await this.audit(tx, platform, id, action, current, updated);
            return updated;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async assertActivationReady(tx, organization) {
        if (organization.onboardingStatus !== client_1.OrganizationOnboardingStatus.READY) {
            throw new common_1.ConflictException('Organization onboarding is not ready');
        }
        const owners = await tx.organizationMembership.count({
            where: { organizationId: organization.id, isTenantOwner: true, status: client_1.OrganizationMembershipStatus.ACTIVE, user: { isActive: true } },
        });
        if (owners < 1)
            throw new common_1.ConflictException('An active Tenant Owner is required');
    }
    requiredOrganization(tx, id) {
        return tx.organization.findUnique({ where: { id }, select: organizationSelect }).then((row) => {
            if (!row)
                throw new common_1.NotFoundException('Organization not found');
            return row;
        });
    }
    async lock(tx, id) {
        await tx.$queryRaw(client_1.Prisma.sql `
      SELECT CAST(pg_advisory_xact_lock(hashtext(${id})) AS TEXT) AS "lockResult"
    `);
    }
    async audit(tx, platform, organizationId, action, before, after) {
        await tx.auditLog.create({
            data: {
                actorId: platform.userId,
                organizationId: null,
                entityType: 'organization',
                entityId: organizationId,
                action,
                before: this.json(before),
                after: this.json(after),
                requestId: platform.requestId ?? null,
                metadata: { platformRole: platform.platformRole, targetOrganizationId: organizationId },
            },
        });
    }
    async recordProvisioningFailure(id, platform, attemptAt, message) {
        try {
            await this.prisma.$transaction(async (tx) => {
                await this.lock(tx, id);
                const organization = await tx.organization.findUnique({ where: { id }, select: { status: true } });
                if (!organization || organization.status !== client_1.OrganizationStatus.PENDING_SETUP)
                    return;
                await tx.organization.update({ where: { id }, data: { onboardingStatus: client_1.OrganizationOnboardingStatus.FAILED, onboardingLastAttemptAt: attemptAt, onboardingFailureCode: 'PROVISIONING_FAILED', onboardingFailureMessage: message } });
                await this.audit(tx, platform, id, 'TENANT_PROVISIONING_FAILED', null, { failureCode: 'PROVISIONING_FAILED' });
            });
        }
        catch {
        }
    }
    json(value) {
        if (value === null || value === undefined)
            return undefined;
        return JSON.parse(JSON.stringify(value));
    }
    normalizeCode(code) {
        const normalized = code.trim().toLowerCase();
        if (!normalized)
            throw new common_1.BadRequestException('Organization code is required');
        return normalized;
    }
    requiredText(value, message) {
        const normalized = value.trim();
        if (!normalized)
            throw new common_1.BadRequestException(message);
        return normalized;
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map