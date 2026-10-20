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
exports.NotificationAdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pagination_util_1 = require("../common/pagination/pagination.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_core_catalog_1 = require("./notification-core.catalog");
const notification_template_engine_service_1 = require("./notification-template-engine.service");
const sms_settings_service_1 = require("./sms/sms-settings.service");
const push_settings_service_1 = require("./push/push-settings.service");
const events = Object.entries(notification_core_catalog_1.NOTIFICATION_EVENT_CATALOG).flatMap(([service, actions]) => Object.entries(actions).map(([action, eventName]) => ({ eventName, service, action })));
const allowedEvents = new Set(events.map((item) => item.eventName));
let NotificationAdminService = class NotificationAdminService {
    constructor(prisma, templateEngine, smsSettings, pushSettings) {
        this.prisma = prisma;
        this.templateEngine = templateEngine;
        this.smsSettings = smsSettings;
        this.pushSettings = pushSettings;
    }
    catalog() {
        return { events };
    }
    listTemplates(query, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const { organizationId } = context;
        return this.prisma.withTenantTransaction(context, (tx) => tx.notificationTemplate.findMany({
            where: {
                organizationId,
                ...(query.eventName ? { eventName: query.eventName } : {}),
                ...(query.channel ? { channel: query.channel } : {}),
                ...(query.locale ? { locale: query.locale } : {}),
                ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
                ...(query.search?.trim()
                    ? { OR: [{ subject: { contains: query.search.trim(), mode: "insensitive" } }, { body: { contains: query.search.trim(), mode: "insensitive" } }] }
                    : {}),
            },
            orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
        }));
    }
    async getTemplate(id, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const { organizationId } = context;
        const item = await this.prisma.withTenantTransaction(context, (tx) => tx.notificationTemplate.findFirst({ where: { id, organizationId } }));
        if (!item)
            throw new common_1.NotFoundException("Notification template not found");
        return item;
    }
    async createTemplate(dto, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const { organizationId } = context;
        this.assertEvent(dto.eventName);
        const locale = dto.locale?.trim() || "fa-IR";
        const subject = dto.channel === client_1.NotificationChannel.SMS ? null : dto.subject?.trim() || null;
        const body = dto.body.trim();
        this.requireInAppSubject(dto.channel, subject);
        this.templateEngine.validate(dto.eventName, subject, body);
        return this.prisma.withTenantTransaction(context, async (tx) => {
            const latest = await tx.notificationTemplate.findFirst({
                where: { organizationId, eventName: dto.eventName, channel: dto.channel, locale },
                orderBy: { version: "desc" },
                select: { version: true },
            });
            const isActive = dto.isActive ?? true;
            if (isActive) {
                await tx.notificationTemplate.updateMany({
                    where: { organizationId, eventName: dto.eventName, channel: dto.channel, locale, isActive: true },
                    data: { isActive: false },
                });
            }
            return tx.notificationTemplate.create({ data: {
                    organizationId, eventName: dto.eventName, channel: dto.channel, locale,
                    subject, body, isActive, version: (latest?.version ?? 0) + 1,
                } });
        });
    }
    async updateTemplate(id, dto, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const previous = await this.getTemplate(id, user);
        if (dto.eventName)
            this.assertEvent(dto.eventName);
        const eventName = dto.eventName ?? previous.eventName;
        const channel = dto.channel ?? previous.channel;
        const locale = dto.locale?.trim() || previous.locale;
        const subject = channel === client_1.NotificationChannel.SMS
            ? null
            : dto.subject !== undefined ? dto.subject?.trim() || null : previous.subject;
        const body = dto.body?.trim() ?? previous.body;
        this.requireInAppSubject(channel, subject);
        this.templateEngine.validate(eventName, subject, body);
        return this.prisma.withTenantTransaction(context, async (tx) => {
            const latest = await tx.notificationTemplate.findFirst({
                where: { organizationId: previous.organizationId, eventName, channel, locale },
                orderBy: { version: "desc" },
                select: { version: true },
            });
            const isActive = dto.isActive ?? true;
            if (isActive) {
                await tx.notificationTemplate.updateMany({
                    where: { organizationId: previous.organizationId, eventName, channel, locale, isActive: true },
                    data: { isActive: false },
                });
            }
            return tx.notificationTemplate.create({ data: {
                    organizationId: previous.organizationId, eventName, channel, locale,
                    subject, body, isActive, version: (latest?.version ?? 0) + 1,
                } });
        });
    }
    async removeTemplate(id, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const { organizationId } = context;
        const updated = await this.prisma.withTenantTransaction(context, (tx) => tx.notificationTemplate.updateMany({ where: { id, organizationId }, data: { isActive: false } }));
        if (!updated.count)
            throw new common_1.NotFoundException("Notification template not found");
        return { deleted: false, deactivated: true };
    }
    templateVariables(eventName) {
        this.assertEvent(eventName);
        return { eventName, variables: this.templateEngine.variables(eventName) };
    }
    previewTemplate(dto) {
        this.assertEvent(dto.eventName);
        const subject = dto.channel === client_1.NotificationChannel.SMS ? null : dto.subject;
        return {
            eventName: dto.eventName,
            channel: dto.channel,
            locale: dto.locale?.trim() || "fa-IR",
            ...this.templateEngine.preview(dto.eventName, subject, dto.body),
        };
    }
    async activateTemplate(id, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const template = await this.getTemplate(id, user);
        this.requireInAppSubject(template.channel, template.subject);
        return this.prisma.withTenantTransaction(context, async (tx) => {
            await tx.notificationTemplate.updateMany({
                where: {
                    organizationId: template.organizationId,
                    eventName: template.eventName,
                    channel: template.channel,
                    locale: template.locale,
                    isActive: true,
                },
                data: { isActive: false },
            });
            return tx.notificationTemplate.update({ where: { id: template.id }, data: { isActive: true } });
        });
    }
    async listDeliveries(query, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const { organizationId } = context;
        const page = query.page || 1, limit = query.pageSize || 20;
        const createdAt = {};
        if (query.dateFrom)
            createdAt.gte = this.date(query.dateFrom, "dateFrom");
        if (query.dateTo)
            createdAt.lte = this.date(query.dateTo, "dateTo");
        const where = {
            organizationId,
            event: {
                organizationId,
                ...(query.eventName ? { eventName: query.eventName } : {}),
                ...(query.aggregateType ? { aggregateType: query.aggregateType } : {}),
                ...(query.aggregateId ? { aggregateId: query.aggregateId } : {}),
            },
            ...(query.channel ? { channel: query.channel } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.recipientUserId ? { recipientUserId: query.recipientUserId } : {}),
            ...(query.ruleId ? { ruleId: query.ruleId } : {}),
            ...(query.templateId ? { templateId: query.templateId } : {}),
            ...(query.triggerType || query.provider ? { attempts: { some: {
                        ...(query.triggerType ? { triggerType: query.triggerType } : {}),
                        ...(query.provider ? { provider: { equals: query.provider, mode: "insensitive" } } : {}),
                    } } } : {}),
            ...(Object.keys(createdAt).length ? { createdAt } : {}),
            ...(query.search?.trim() ? { OR: [
                    { destination: { contains: query.search.trim(), mode: "insensitive" } },
                    { failureMessage: { contains: query.search.trim(), mode: "insensitive" } },
                    { providerMessageId: { contains: query.search.trim(), mode: "insensitive" } },
                    { event: { is: { eventName: { contains: query.search.trim(), mode: "insensitive" } } } },
                    { rule: { is: { name: { contains: query.search.trim(), mode: "insensitive" } } } },
                    { recipientUser: { is: { OR: [
                                    { fullName: { contains: query.search.trim(), mode: "insensitive" } },
                                    { email: { contains: query.search.trim(), mode: "insensitive" } },
                                ] } } },
                ] } : {}),
        };
        const [data, total] = await this.prisma.withTenantTransaction(context, (tx) => Promise.all([
            tx.notificationDelivery.findMany({ where, select: {
                    id: true, channel: true, status: true, destination: true, attemptCount: true,
                    priority: true, orchestrationReason: true, deferredUntil: true, digestBucketId: true, escalationRunId: true,
                    providerMessageId: true, failureCode: true, failureMessage: true,
                    lastAttemptAt: true, nextAttemptAt: true, processingStartedAt: true,
                    sentAt: true, deliveredAt: true, createdAt: true, updatedAt: true,
                    event: { select: { eventName: true, occurredAt: true, aggregateType: true, aggregateId: true, actorId: true, payload: true } },
                    recipientUser: { select: { id: true, fullName: true, email: true } },
                    rule: { select: { id: true, name: true } },
                    template: { select: { id: true, version: true, locale: true } },
                    attempts: { orderBy: { attemptNumber: "desc" }, take: 1, select: { triggerType: true, provider: true, triggeredByUser: { select: { id: true, fullName: true } } } },
                }, orderBy: { [query.sortBy]: query.sortDirection }, skip: (page - 1) * limit, take: limit }),
            tx.notificationDelivery.count({ where }),
        ]));
        return { data: data.map(item => this.deliverySummary(item)), meta: (0, pagination_util_1.createPaginationMeta)(page, limit, total) };
    }
    async getDelivery(id, user) {
        const context = tenant_scope_util_1.tenantScope.require(user);
        const { organizationId } = context;
        const item = await this.prisma.withTenantTransaction(context, (tx) => tx.notificationDelivery.findFirst({ where: { id, organizationId }, select: {
                id: true, channel: true, status: true, destination: true, deduplicationKey: true,
                priority: true, orchestrationReason: true, deferredUntil: true, digestBucketId: true, escalationRunId: true,
                attemptCount: true, providerMessageId: true, failureCode: true, failureMessage: true,
                lastAttemptAt: true, nextAttemptAt: true, processingStartedAt: true,
                retryRequestedAt: true, sentAt: true, deliveredAt: true, createdAt: true, updatedAt: true,
                event: { select: { id: true, eventName: true, aggregateType: true, aggregateId: true, actorId: true, idempotencyKey: true, occurredAt: true, payload: true, actor: { select: { id: true, fullName: true } } } },
                recipientUser: { select: { id: true, fullName: true, email: true } },
                recipientRule: { select: { id: true, type: true, targetId: true } },
                retryRequestedBy: { select: { id: true, fullName: true } },
                rule: { select: { id: true, name: true, mandatory: true } },
                template: { select: { id: true, eventName: true, channel: true, locale: true, version: true, subject: true } },
                attempts: { orderBy: { attemptNumber: "asc" }, select: { id: true, attemptNumber: true, triggerType: true, status: true, provider: true, providerMessageId: true, failureCategory: true, failureCode: true, failureReason: true, startedAt: true, finishedAt: true, createdAt: true, triggeredByUser: { select: { id: true, fullName: true } } } },
            } }));
        if (!item)
            throw new common_1.NotFoundException("Notification delivery not found");
        const schedule = this.scheduleMetadata(item.event.payload);
        return {
            ...item,
            destination: this.maskDestination(item.destination, item.channel),
            deduplicationKey: `${item.deduplicationKey.slice(0, 12)}…`,
            failureMessage: this.sanitizeFailure(item.failureMessage),
            event: { ...item.event, payload: undefined, schedule },
            attempts: item.attempts.map(attempt => ({ ...attempt, failureReason: this.sanitizeFailure(attempt.failureReason) })),
            triggerType: item.attempts[item.attempts.length - 1]?.triggerType ?? this.inferTriggerType(item.event.actorId, item.event.payload),
            triggeredBy: item.attempts[item.attempts.length - 1]?.triggeredByUser ?? item.event.actor,
            failureCategory: item.failureCode ? this.failureCategory(item.failureCode) : null,
            lastFailureAt: [...item.attempts].reverse().find(attempt => attempt.status === "FAILED")?.finishedAt ?? null,
            deduplication: { enabled: true, key: `${item.deduplicationKey.slice(0, 12)}…` },
        };
    }
    deliverySummary(item) {
        const latest = item.attempts[0];
        return { ...item, destination: this.maskDestination(item.destination, item.channel), failureMessage: this.sanitizeFailure(item.failureMessage), triggerType: latest?.triggerType ?? this.inferTriggerType(item.event.actorId, item.event.payload), provider: latest?.provider ?? item.channel, triggeredBy: latest?.triggeredByUser ?? null, event: { ...item.event, payload: undefined } };
    }
    inferTriggerType(actorId, payload) {
        const value = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
        if (value.schedule)
            return client_1.NotificationTriggerType.SCHEDULED;
        return actorId ? client_1.NotificationTriggerType.DOMAIN_EVENT : client_1.NotificationTriggerType.SYSTEM;
    }
    scheduleMetadata(payload) {
        const value = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
        const schedule = value.schedule && typeof value.schedule === "object" && !Array.isArray(value.schedule) ? value.schedule : null;
        if (!schedule)
            return null;
        const safe = ["scheduledAt", "detectedAt", "offsetMinutes", "sourceField"].reduce((result, key) => {
            if (["string", "number", "boolean"].includes(typeof schedule[key]))
                result[key] = schedule[key];
            return result;
        }, {});
        return Object.keys(safe).length ? safe : null;
    }
    maskDestination(value, channel) {
        if (!value)
            return null;
        if (channel === client_1.NotificationChannel.EMAIL) {
            const [name, domain] = value.split("@");
            return domain ? `${name?.slice(0, 1) || "*"}***@${domain}` : "***";
        }
        if (channel === client_1.NotificationChannel.SMS)
            return value.length > 6 ? `${value.slice(0, 4)}***${value.slice(-3)}` : "***";
        return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
    }
    sanitizeFailure(value) {
        if (!value)
            return null;
        return value.slice(0, 1000).replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").replace(/(api[-_ ]?key|password|token|secret)\s*[=:]\s*[^\s,;]+/gi, "$1=[REDACTED]").replace(/([?&](?:key|token|secret|signature)=)[^&\s]+/gi, "$1[REDACTED]");
    }
    failureCategory(code) {
        const value = code.toUpperCase();
        if (value.includes("TIMEOUT"))
            return "TIMEOUT";
        if (value.includes("AUTH") || value.includes("401") || value.includes("403"))
            return "AUTHENTICATION";
        if (value.includes("RATE") || value.includes("429"))
            return "RATE_LIMIT";
        if (value.includes("DESTINATION") || value.includes("RECIPIENT") || value.includes("ENDPOINT"))
            return "INVALID_DESTINATION";
        if (value.includes("TEMPLATE"))
            return "TEMPLATE_ERROR";
        if (value.includes("CONFIG") || value.includes("NOT_CONFIGURED"))
            return "CONFIGURATION";
        if (value.includes("NETWORK") || value.includes("DISPATCH") || /^HTTP_5/.test(value))
            return "NETWORK";
        if (value.includes("PROVIDER") || value.startsWith("HTTP_4"))
            return "PROVIDER_REJECTED";
        return "UNKNOWN";
    }
    async channelStatus(user) {
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        const email = await this.prisma.organizationSettings.findUnique({ where: { organizationId }, select: { smtpEnabled: true, smtpHost: true, smtpPort: true, smtpFromEmail: true } });
        const emailConfigured = Boolean(email?.smtpEnabled && email.smtpHost && email.smtpPort && email.smtpFromEmail);
        return [
            { channel: "EMAIL", available: emailConfigured, configured: emailConfigured, usable: emailConfigured, provider: email?.smtpHost || null, configurationPath: "/admin/email-settings" },
            await this.smsSettings.status(organizationId),
            await this.pushSettings.status(tenant_scope_util_1.tenantScope.require(user)),
            { channel: "IN_APP", available: true, configured: true, enabled: true, usable: true, provider: "Notification Center", configurationPath: null },
        ];
    }
    assertEvent(eventName) {
        if (!allowedEvents.has(eventName))
            throw new common_1.BadRequestException(`Unsupported notification event: ${eventName}`);
    }
    requireInAppSubject(channel, subject) {
        if (channel === client_1.NotificationChannel.IN_APP && !subject?.trim())
            throw new common_1.BadRequestException('عنوان قالب اعلان داخل سامانه الزامی است');
    }
    date(value, field) {
        const result = new Date(value);
        if (Number.isNaN(result.getTime()))
            throw new common_1.BadRequestException(`${field} is invalid`);
        return result;
    }
};
exports.NotificationAdminService = NotificationAdminService;
exports.NotificationAdminService = NotificationAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_template_engine_service_1.NotificationTemplateEngineService,
        sms_settings_service_1.SmsSettingsService,
        push_settings_service_1.PushSettingsService])
], NotificationAdminService);
//# sourceMappingURL=notification-admin.service.js.map