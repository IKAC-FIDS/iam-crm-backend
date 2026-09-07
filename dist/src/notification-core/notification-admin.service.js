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
const events = Object.entries(notification_core_catalog_1.NOTIFICATION_EVENT_CATALOG).flatMap(([service, actions]) => Object.entries(actions).map(([action, eventName]) => ({ eventName, service, action })));
const allowedEvents = new Set(events.map((item) => item.eventName));
let NotificationAdminService = class NotificationAdminService {
    constructor(prisma, templateEngine, smsSettings) {
        this.prisma = prisma;
        this.templateEngine = templateEngine;
        this.smsSettings = smsSettings;
    }
    catalog() {
        return { events };
    }
    listTemplates(query, user) {
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.notificationTemplate.findMany({
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
        });
    }
    async getTemplate(id, user) {
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        const item = await this.prisma.notificationTemplate.findFirst({ where: { id, organizationId } });
        if (!item)
            throw new common_1.NotFoundException("Notification template not found");
        return item;
    }
    async createTemplate(dto, user) {
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        this.assertEvent(dto.eventName);
        const locale = dto.locale?.trim() || "fa-IR";
        const subject = dto.channel === client_1.NotificationChannel.SMS ? null : dto.subject?.trim() || null;
        const body = dto.body.trim();
        this.requireInAppSubject(dto.channel, subject);
        this.templateEngine.validate(dto.eventName, subject, body);
        return this.prisma.$transaction(async (tx) => {
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
        return this.prisma.$transaction(async (tx) => {
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
        await this.getTemplate(id, user);
        await this.prisma.notificationTemplate.update({ where: { id }, data: { isActive: false } });
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
        const template = await this.getTemplate(id, user);
        this.requireInAppSubject(template.channel, template.subject);
        return this.prisma.$transaction(async (tx) => {
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
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        const page = query.page || 1, limit = query.pageSize || 20;
        const createdAt = {};
        if (query.dateFrom)
            createdAt.gte = this.date(query.dateFrom, "dateFrom");
        if (query.dateTo)
            createdAt.lte = this.date(query.dateTo, "dateTo");
        const where = {
            event: { organizationId, ...(query.eventName ? { eventName: query.eventName } : {}) },
            ...(query.channel ? { channel: query.channel } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.recipientUserId ? { recipientUserId: query.recipientUserId } : {}),
            ...(Object.keys(createdAt).length ? { createdAt } : {}),
            ...(query.search?.trim() ? { OR: [
                    { destination: { contains: query.search.trim(), mode: "insensitive" } },
                    { failureMessage: { contains: query.search.trim(), mode: "insensitive" } },
                    { providerMessageId: { contains: query.search.trim(), mode: "insensitive" } },
                    { recipientUser: { is: { OR: [
                                    { fullName: { contains: query.search.trim(), mode: "insensitive" } },
                                    { email: { contains: query.search.trim(), mode: "insensitive" } },
                                ] } } },
                ] } : {}),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.notificationDelivery.findMany({ where, include: {
                    event: { select: { eventName: true, occurredAt: true } },
                    recipientUser: { select: { id: true, fullName: true, email: true } },
                }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
            this.prisma.notificationDelivery.count({ where }),
        ]);
        return { data, meta: (0, pagination_util_1.createPaginationMeta)(page, limit, total) };
    }
    async getDelivery(id, user) {
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        const item = await this.prisma.notificationDelivery.findFirst({ where: { id, event: { organizationId } }, include: { event: true, recipientUser: { select: { id: true, fullName: true, email: true } }, rule: { select: { id: true, name: true } }, template: true } });
        if (!item)
            throw new common_1.NotFoundException("Notification delivery not found");
        return item;
    }
    async channelStatus(user) {
        const { organizationId } = tenant_scope_util_1.tenantScope.require(user);
        const email = await this.prisma.organizationSettings.findUnique({ where: { organizationId }, select: { smtpEnabled: true, smtpHost: true, smtpPort: true, smtpFromEmail: true } });
        const emailConfigured = Boolean(email?.smtpEnabled && email.smtpHost && email.smtpPort && email.smtpFromEmail);
        return [
            { channel: "EMAIL", available: emailConfigured, configured: emailConfigured, usable: emailConfigured, provider: email?.smtpHost || null, configurationPath: "/admin/email-settings" },
            await this.smsSettings.status(organizationId),
            { channel: "PUSH", available: false, configured: false, usable: false, provider: null, configurationPath: null },
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
        sms_settings_service_1.SmsSettingsService])
], NotificationAdminService);
//# sourceMappingURL=notification-admin.service.js.map