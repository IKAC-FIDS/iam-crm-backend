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
exports.NotificationPolicyAdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tenant_scope_util_1 = require("../../common/tenant/tenant-scope.util");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_time_window_1 = require("./notification-time-window");
const notification_policy_condition_validator_service_1 = require("../policy/notification-policy-condition-validator.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
let NotificationPolicyAdminService = class NotificationPolicyAdminService {
    constructor(prisma, audit, conditions) {
        this.prisma = prisma;
        this.audit = audit;
        this.conditions = conditions;
    }
    async quietHours(user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, tx => tx.notificationQuietHoursPolicy.findUnique({ where: { organizationId: tenant.organizationId } }));
    }
    async updateQuietHours(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        this.validateClock(dto.startTime, dto.timezone);
        this.validateClock(dto.endTime, dto.timezone);
        const before = await this.quietHours(user);
        const result = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationQuietHoursPolicy.upsert({ where: { organizationId: tenant.organizationId }, create: { organizationId: tenant.organizationId, ...dto }, update: dto }));
        await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_QUIET_HOURS", entityId: result.id, action: "UPDATE", before, after: result });
        return result;
    }
    listDigests(user) { const tenant = tenant_scope_util_1.tenantScope.require(user); return this.prisma.withTenantTransaction(tenant, tx => tx.notificationDigestPolicy.findMany({ where: { organizationId: tenant.organizationId }, orderBy: { createdAt: "desc" } })); }
    async createDigest(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        this.validateDigest(dto);
        await this.validateTemplates(tenant.organizationId, dto.eventNames, dto.channels);
        const result = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationDigestPolicy.create({ data: { organizationId: tenant.organizationId, ...dto } }));
        await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_DIGEST_POLICY", entityId: result.id, action: "CREATE", after: result });
        return result;
    }
    async updateDigest(id, dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const before = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationDigestPolicy.findFirst({ where: { id, organizationId: tenant.organizationId } }));
        if (!before)
            throw new common_1.NotFoundException("Digest policy not found");
        this.validateDigest({ ...before, ...dto });
        await this.validateTemplates(tenant.organizationId, dto.eventNames ?? before.eventNames, dto.channels ?? before.channels);
        const result = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationDigestPolicy.update({ where: { id }, data: dto }));
        await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_DIGEST_POLICY", entityId: id, action: "UPDATE", before, after: result });
        return result;
    }
    async removeDigest(id, user) { const tenant = tenant_scope_util_1.tenantScope.require(user); const result = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationDigestPolicy.updateMany({ where: { id, organizationId: tenant.organizationId }, data: { enabled: false } })); if (!result.count)
        throw new common_1.NotFoundException("Digest policy not found"); await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_DIGEST_POLICY", entityId: id, action: "DISABLE" }); return { disabled: true }; }
    listEscalations(user) { const tenant = tenant_scope_util_1.tenantScope.require(user); return this.prisma.withTenantTransaction(tenant, tx => tx.notificationEscalationPolicy.findMany({ where: { organizationId: tenant.organizationId }, include: { steps: { orderBy: { stepOrder: "asc" } } }, orderBy: { createdAt: "desc" } })); }
    async createEscalation(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        this.validateEscalation(dto);
        this.conditions.validate(dto.eventName, dto.conditions);
        await this.validateTemplates(tenant.organizationId, [dto.eventName], [...new Set(dto.steps.flatMap(step => step.channels))]);
        const result = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationEscalationPolicy.create({ data: { organizationId: tenant.organizationId, name: dto.name.trim(), enabled: dto.enabled ?? true, eventName: dto.eventName, aggregateType: dto.aggregateType ?? "TASK", conditions: dto.conditions === null || dto.conditions === undefined ? client_1.Prisma.DbNull : dto.conditions, steps: { create: dto.steps.map((step, index) => ({ ...step, targetId: step.targetId ?? null, stepOrder: index + 1 })) } }, include: { steps: true } }));
        await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_ESCALATION_POLICY", entityId: result.id, action: "CREATE", after: result });
        return result;
    }
    async updateEscalation(id, dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const before = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationEscalationPolicy.findFirst({ where: { id, organizationId: tenant.organizationId }, include: { steps: true } }));
        if (!before)
            throw new common_1.NotFoundException("Escalation policy not found");
        if (dto.steps)
            this.validateEscalation({ ...before, ...dto, steps: dto.steps });
        this.conditions.validate(dto.eventName ?? before.eventName, dto.conditions !== undefined ? dto.conditions : before.conditions);
        await this.validateTemplates(tenant.organizationId, [dto.eventName ?? before.eventName], [...new Set((dto.steps ?? before.steps).flatMap(step => step.channels))]);
        const effective = { name: dto.name?.trim() ?? before.name, enabled: dto.enabled ?? before.enabled, eventName: dto.eventName ?? before.eventName, aggregateType: dto.aggregateType ?? before.aggregateType, conditions: dto.conditions !== undefined ? dto.conditions : before.conditions, steps: dto.steps ?? before.steps.map(step => ({ delayMinutes: step.delayMinutes, recipientType: step.recipientType, targetId: step.targetId, channels: step.channels, priority: step.priority, mandatory: step.mandatory })) };
        const result = await this.prisma.withTenantTransaction(tenant, async (tx) => {
            await tx.notificationEscalationPolicy.update({ where: { id }, data: { enabled: false } });
            return tx.notificationEscalationPolicy.create({ data: { organizationId: tenant.organizationId, name: effective.name, enabled: effective.enabled, eventName: effective.eventName, aggregateType: effective.aggregateType, conditions: effective.conditions === null ? client_1.Prisma.DbNull : effective.conditions, steps: { create: effective.steps.map((step, index) => ({ ...step, targetId: step.targetId ?? null, stepOrder: index + 1 })) } }, include: { steps: { orderBy: { stepOrder: "asc" } } } });
        });
        await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_ESCALATION_POLICY", entityId: result.id, action: "VERSION", before, after: result, metadata: { previousPolicyId: id } });
        return result;
    }
    async removeEscalation(id, user) { const tenant = tenant_scope_util_1.tenantScope.require(user); const result = await this.prisma.withTenantTransaction(tenant, tx => tx.notificationEscalationPolicy.updateMany({ where: { id, organizationId: tenant.organizationId }, data: { enabled: false } })); if (!result.count)
        throw new common_1.NotFoundException("Escalation policy not found"); await this.audit.recordTenantEvent({ organizationId: tenant.organizationId, actorId: user.userId, entityType: "NOTIFICATION_ESCALATION_POLICY", entityId: id, action: "DISABLE" }); return { disabled: true }; }
    validateClock(time, timezone) { try {
        (0, notification_time_window_1.assertTime)(time);
        (0, notification_time_window_1.assertTimeZone)(timezone);
    }
    catch (error) {
        throw new common_1.BadRequestException(error instanceof Error ? error.message : "Invalid time settings");
    } }
    validateDigest(dto) { this.validateClock(dto.sendTime, dto.timezone); if (dto.channels.some(channel => channel !== client_1.NotificationChannel.EMAIL))
        throw new common_1.BadRequestException("Daily digest currently supports EMAIL only"); }
    validateEscalation(dto) {
        if (new Set(dto.steps.map(step => step.delayMinutes)).size !== dto.steps.length)
            throw new common_1.BadRequestException("Escalation delays must be unique");
        dto.steps.forEach((step, index) => { if (index && step.delayMinutes < dto.steps[index - 1].delayMinutes)
            throw new common_1.BadRequestException("Escalation delays must be ascending"); const requiresTarget = step.recipientType === client_1.NotificationRecipientType.USER || step.recipientType === client_1.NotificationRecipientType.ROLE || step.recipientType === client_1.NotificationRecipientType.TEAM; if (requiresTarget !== Boolean(step.targetId))
            throw new common_1.BadRequestException("Escalation recipient target is invalid"); });
    }
    async validateTemplates(organizationId, eventNames, channels) {
        const rows = await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.notificationTemplate.findMany({ where: { organizationId, eventName: { in: eventNames }, channel: { in: channels }, isActive: true }, select: { eventName: true, channel: true } }));
        const available = new Set(rows.map(row => `${row.eventName}:${row.channel}`));
        const missing = eventNames.flatMap(eventName => channels.map(channel => `${eventName}:${channel}`)).filter(key => !available.has(key));
        if (missing.length)
            throw new common_1.BadRequestException(`Active templates are required: ${missing.join(", ")}`);
    }
};
exports.NotificationPolicyAdminService = NotificationPolicyAdminService;
exports.NotificationPolicyAdminService = NotificationPolicyAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService, notification_policy_condition_validator_service_1.NotificationPolicyConditionValidator])
], NotificationPolicyAdminService);
//# sourceMappingURL=notification-policy-admin.service.js.map