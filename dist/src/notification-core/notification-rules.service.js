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
exports.NotificationRulesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_core_catalog_1 = require("./notification-core.catalog");
const ruleInclude = {
    recipientRules: {
        orderBy: { createdAt: "asc" },
    },
};
const ALLOWED_EVENTS = new Set([
    ...Object.values(notification_core_catalog_1.NOTIFICATION_EVENT_CATALOG.MEETING),
    ...Object.values(notification_core_catalog_1.NOTIFICATION_EVENT_CATALOG.TASK),
]);
const ALLOWED_CHANNELS = new Set(notification_core_catalog_1.NOTIFICATION_CHANNELS);
let NotificationRulesService = class NotificationRulesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, (tx) => tx.notificationRule.findMany({
            where: { organizationId: tenant.organizationId },
            include: ruleInclude,
            orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        }));
    }
    async get(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const rule = await this.prisma.withTenantTransaction(tenant, (tx) => tx.notificationRule.findFirst({
            where: { id, organizationId: tenant.organizationId },
            include: ruleInclude,
        }));
        if (!rule)
            throw new common_1.NotFoundException("Notification rule not found");
        return rule;
    }
    async create(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        this.validateEvent(dto.eventName);
        await this.validateRecipients(dto.recipientRules, tenant.organizationId);
        return this.prisma.withTenantTransaction(tenant, (tx) => tx.notificationRule.create({
            data: {
                organizationId: tenant.organizationId,
                name: dto.name.trim(),
                eventName: dto.eventName,
                enabled: dto.enabled ?? true,
                mandatory: dto.mandatory ?? false,
                priority: dto.priority ?? 100,
                recipientRules: {
                    create: dto.recipientRules.map((recipient) => this.recipientCreateData(recipient)),
                },
            },
            include: ruleInclude,
        }));
    }
    async update(id, dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        await this.get(id, user);
        if (dto.eventName)
            this.validateEvent(dto.eventName);
        if (dto.recipientRules) {
            await this.validateRecipients(dto.recipientRules, tenant.organizationId);
        }
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            if (dto.recipientRules) {
                await tx.notificationRecipientRule.deleteMany({ where: { ruleId: id } });
            }
            return tx.notificationRule.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
                    ...(dto.eventName !== undefined ? { eventName: dto.eventName } : {}),
                    ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
                    ...(dto.mandatory !== undefined ? { mandatory: dto.mandatory } : {}),
                    ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
                    ...(dto.recipientRules
                        ? {
                            recipientRules: {
                                create: dto.recipientRules.map((recipient) => this.recipientCreateData(recipient)),
                            },
                        }
                        : {}),
                },
                include: ruleInclude,
            });
        });
    }
    async remove(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const deleted = await this.prisma.withTenantTransaction(tenant, (tx) => tx.notificationRule.deleteMany({ where: { id, organizationId: tenant.organizationId } }));
        if (!deleted.count)
            throw new common_1.NotFoundException("Notification rule not found");
        return { deleted: true };
    }
    catalog() {
        return {
            events: [...ALLOWED_EVENTS],
            recipientTypes: Object.values(client_1.NotificationRecipientType),
            channels: Object.values(client_1.NotificationChannel),
        };
    }
    async userTargets(user, search) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.user.findMany({
            where: {
                organizationId: tenant.organizationId,
                isActive: true,
                ...(search?.trim()
                    ? {
                        OR: [
                            { fullName: { contains: search.trim(), mode: "insensitive" } },
                            { email: { contains: search.trim(), mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            select: { id: true, fullName: true, email: true },
            orderBy: { fullName: "asc" },
            take: 100,
        });
    }
    async teamTargets(user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.team.findMany({
            where: { organizationId: tenant.organizationId, isActive: true },
            select: { id: true, code: true, name: true },
            orderBy: { name: "asc" },
            take: 100,
        });
    }
    async roleTargets(user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.role.findMany({
            where: {
                isActive: true,
                OR: [
                    { scope: client_1.RoleScope.SYSTEM },
                    { scope: client_1.RoleScope.TENANT, organizationId: tenant.organizationId },
                ],
            },
            select: {
                id: true,
                code: true,
                normalizedCode: true,
                name: true,
                scope: true,
                baseRole: true,
            },
            orderBy: [{ scope: "asc" }, { name: "asc" }],
            take: 100,
        });
    }
    validateEvent(eventName) {
        if (!ALLOWED_EVENTS.has(eventName)) {
            throw new common_1.BadRequestException(`Unsupported notification event: ${eventName}`);
        }
    }
    recipientCreateData(recipient) {
        return {
            type: recipient.type,
            targetId: recipient.targetId ?? null,
            channels: [...new Set(recipient.channels)],
            enabled: recipient.enabled ?? true,
        };
    }
    async validateRecipients(recipients, organizationId) {
        for (const recipient of recipients) {
            const channels = [...new Set(recipient.channels)];
            if (!channels.length || channels.some((channel) => !ALLOWED_CHANNELS.has(channel))) {
                throw new common_1.BadRequestException("Recipient must define supported channels");
            }
            const requiresTarget = recipient.type === client_1.NotificationRecipientType.USER ||
                recipient.type === client_1.NotificationRecipientType.ROLE ||
                recipient.type === client_1.NotificationRecipientType.TEAM;
            if (requiresTarget && !recipient.targetId) {
                throw new common_1.BadRequestException(`${recipient.type} recipient requires targetId`);
            }
            if (!requiresTarget && recipient.targetId) {
                throw new common_1.BadRequestException(`${recipient.type} recipient must not define targetId`);
            }
            if (recipient.type === client_1.NotificationRecipientType.USER && recipient.targetId) {
                const target = await this.prisma.user.findFirst({
                    where: {
                        id: recipient.targetId,
                        organizationId,
                        isActive: true,
                    },
                    select: { id: true },
                });
                if (!target)
                    throw new common_1.BadRequestException("Recipient user is unavailable");
            }
            if (recipient.type === client_1.NotificationRecipientType.TEAM && recipient.targetId) {
                const target = await this.prisma.team.findFirst({
                    where: {
                        id: recipient.targetId,
                        organizationId,
                        isActive: true,
                    },
                    select: { id: true },
                });
                if (!target)
                    throw new common_1.BadRequestException("Recipient team is unavailable");
            }
            if (recipient.type === client_1.NotificationRecipientType.ROLE && recipient.targetId) {
                const target = await this.prisma.role.findFirst({
                    where: {
                        id: recipient.targetId,
                        isActive: true,
                        OR: [
                            { scope: client_1.RoleScope.SYSTEM },
                            { scope: client_1.RoleScope.TENANT, organizationId },
                        ],
                    },
                    select: { id: true },
                });
                if (!target)
                    throw new common_1.BadRequestException("Recipient role is unavailable");
            }
        }
    }
};
exports.NotificationRulesService = NotificationRulesService;
exports.NotificationRulesService = NotificationRulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationRulesService);
//# sourceMappingURL=notification-rules.service.js.map