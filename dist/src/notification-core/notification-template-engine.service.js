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
exports.NotificationTemplateEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_core_catalog_1 = require("./notification-core.catalog");
const PLACEHOLDER = /{{\s*([^{}]+?)\s*}}/g;
const SAFE_PATH = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)*$/;
const DANGEROUS_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);
const DATE_VARIABLE_PATHS = new Set(Object.values(notification_core_catalog_1.NOTIFICATION_TEMPLATE_VARIABLES)
    .flat()
    .filter((item) => item.type === "date")
    .map((item) => item.key));
let NotificationTemplateEngineService = class NotificationTemplateEngineService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    variables(eventName) {
        return notification_core_catalog_1.NOTIFICATION_TEMPLATE_VARIABLES[eventName] ?? [];
    }
    validate(eventName, subject, body) {
        const allowed = new Set(this.variables(eventName).map((item) => item.key));
        if (!allowed.size)
            throw new common_1.BadRequestException(`Unsupported notification event: ${eventName}`);
        const invalid = this.extract(subject, body).filter((path) => !this.isSafePath(path) || !allowed.has(path));
        if (invalid.length) {
            throw new common_1.BadRequestException(`Invalid template variables: ${[...new Set(invalid)].join(", ")}`);
        }
    }
    render(input) {
        const missingVariables = new Set();
        const renderText = (text) => {
            if (text == null)
                return text ?? null;
            return text.replace(PLACEHOLDER, (token, rawPath) => {
                const path = rawPath.trim();
                if (!this.isSafePath(path)) {
                    missingVariables.add(path);
                    return token;
                }
                const value = this.lookup(input.context, path);
                if (value === undefined || value === null) {
                    missingVariables.add(path);
                    return token;
                }
                return DATE_VARIABLE_PATHS.has(path) ? this.formatPersianDateTime(value) : String(value);
            });
        };
        return {
            subject: renderText(input.subject),
            body: renderText(input.body) ?? "",
            missingVariables: [...missingVariables],
        };
    }
    async resolve(organizationId, eventName, channel, locale, db = this.prisma) {
        const template = await db.notificationTemplate.findFirst({
            where: { organizationId, eventName, channel, locale, isActive: true },
            orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        });
        if (!template)
            throw new common_1.NotFoundException("No active notification template found");
        return template;
    }
    async renderDelivery(event, recipientUserId, channel, db = this.prisma) {
        const organization = await db.organization.findUnique({
            where: { id: event.organizationId }, select: { id: true, name: true, locale: true },
        });
        if (!organization)
            throw new common_1.NotFoundException("Notification organization not found");
        const template = await this.resolve(event.organizationId, event.eventName, channel, organization.locale || "fa-IR", db);
        const context = await this.buildContext(event, recipientUserId, organization, db);
        const rendered = this.render({ subject: template.subject, body: template.body, context });
        return { template, ...rendered };
    }
    async renderStoredTemplate(event, recipientUserId, template, db = this.prisma) {
        if (template.organizationId !== event.organizationId || template.eventName !== event.eventName) {
            throw new common_1.BadRequestException("Notification template does not match delivery event");
        }
        const organization = await db.organization.findUnique({
            where: { id: event.organizationId }, select: { id: true, name: true, locale: true },
        });
        if (!organization)
            throw new common_1.NotFoundException("Notification organization not found");
        const context = await this.buildContext(event, recipientUserId, organization, db);
        const rendered = this.render({ subject: template.subject, body: template.body, context });
        return {
            ...rendered,
            subject: rendered.subject?.replace(PLACEHOLDER, "—") ?? null,
            body: rendered.body.replace(PLACEHOLDER, "—"),
        };
    }
    preview(eventName, subject, body) {
        this.validate(eventName, subject, body);
        return this.render({ subject, body, context: this.sampleContext(eventName) });
    }
    async buildContext(event, recipientUserId, organization, db = this.prisma) {
        const [user, actor] = await Promise.all([
            db.user.findFirst({ where: { id: recipientUserId, organizationMemberships: { some: { organizationId: event.organizationId, status: 'ACTIVE' } }, isActive: true }, select: { id: true, fullName: true, email: true } }),
            event.actorId ? db.user.findFirst({ where: { id: event.actorId, organizationMemberships: { some: { organizationId: event.organizationId, status: 'ACTIVE' } } }, select: { id: true, fullName: true } }) : null,
        ]);
        if (!user)
            throw new common_1.NotFoundException("Notification recipient not found");
        const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {};
        const base = { user, actor, organization: { id: organization.id, name: organization.name }, schedule: payload.schedule ?? null };
        if (event.aggregateType === "MEETING") {
            const meeting = await db.meeting.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { id: true, title: true, startAt: true, endAt: true, location: true, agenda: true, type: { select: { code: true } }, company: { select: { id: true, legalName: true, brandName: true } } },
            });
            if (!meeting)
                throw new common_1.NotFoundException("Notification meeting not found");
            return {
                ...base,
                meeting: {
                    ...meeting,
                    type: meeting.type?.code ?? null,
                    company: meeting.company
                        ? { id: meeting.company.id, name: meeting.company.brandName || meeting.company.legalName }
                        : null,
                },
            };
        }
        if (event.aggregateType === "TASK") {
            const task = await db.task.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { id: true, title: true, description: true, dueAt: true, priority: true, assignedTo: { select: { fullName: true } }, opportunity: { select: { title: true } }, company: { select: { id: true, legalName: true, brandName: true } } },
            });
            if (!task)
                throw new common_1.NotFoundException("Notification task not found");
            return {
                ...base,
                task: {
                    ...task,
                    dueDate: task.dueAt,
                    company: task.company
                        ? { id: task.company.id, name: task.company.brandName || task.company.legalName }
                        : null,
                },
            };
        }
        if (event.aggregateType === "OPPORTUNITY") {
            const opportunity = await db.opportunity.findFirst({
                where: { id: event.aggregateId, organizationId: event.organizationId },
                select: { id: true, title: true, priority: true, probability: true, stage: { select: { code: true } } },
            });
            if (!opportunity)
                throw new common_1.NotFoundException("Notification opportunity not found");
            return { ...base, opportunity: { id: opportunity.id, title: opportunity.title, priority: opportunity.priority, probability: opportunity.probability, stage: opportunity.stage.code, fromStage: typeof payload.fromStage === "string" ? payload.fromStage : null, toStage: typeof payload.toStage === "string" ? payload.toStage : opportunity.stage.code } };
        }
        return base;
    }
    sampleContext(eventName) {
        const base = {
            user: { id: "preview-user", fullName: "علی رضایی", email: "ali@example.com" },
            actor: { id: "preview-actor", fullName: "مدیر سامانه" },
            organization: { id: "preview-organization", name: "سازمان نمونه" },
        };
        const schedule = { offsetMinutes: -1440, scheduledAt: "2026-09-11T09:00:00.000Z", detectedAt: "2026-09-11T09:03:00.000Z" };
        if (eventName.startsWith("MEETING."))
            return { ...base, schedule, meeting: { id: "preview-meeting", title: "بررسی قرارداد", type: "SALES_MEETING", startAt: "۱۴۰۵/۰۶/۱۵، ۱۰:۰۰", endAt: "۱۴۰۵/۰۶/۱۵، ۱۱:۰۰", location: "اتاق جلسات", agenda: "مرور شرایط قرارداد", company: { id: "preview-company", name: "شرکت نمونه" } } };
        if (eventName.startsWith("TASK."))
            return { ...base, schedule, task: { id: "preview-task", title: "پیگیری پیشنهاد", description: "تماس با مشتری", dueAt: "۱۴۰۵/۰۶/۲۰، ۱۲:۰۰", dueDate: "۱۴۰۵/۰۶/۲۰، ۱۲:۰۰", priority: "MEDIUM", assignee: { fullName: "علی رضایی" }, opportunity: { title: "فرصت نمونه" }, company: { id: "preview-company", name: "شرکت نمونه" } } };
        if (eventName.startsWith("OPPORTUNITY."))
            return { ...base, opportunity: { id: "preview-opportunity", title: "فرصت نمونه", priority: "HIGH", probability: 80, stage: "WON", fromStage: "QUALIFIED", toStage: "WON" } };
        return base;
    }
    extract(...texts) {
        return texts.flatMap((text) => [...(text ?? "").matchAll(PLACEHOLDER)].map((match) => (match[1] ?? "").trim()));
    }
    isSafePath(path) {
        return SAFE_PATH.test(path) && path.split(".").every((segment) => !DANGEROUS_SEGMENTS.has(segment));
    }
    lookup(context, path) {
        let current = context;
        for (const segment of path.split(".")) {
            if (!current || typeof current !== "object" || Array.isArray(current))
                return undefined;
            if (!Object.prototype.hasOwnProperty.call(current, segment))
                return undefined;
            current = current[segment];
        }
        return current;
    }
    formatPersianDateTime(value) {
        const parsed = value instanceof Date ? value : typeof value === "string" ? new Date(value) : null;
        if (!parsed || Number.isNaN(parsed.getTime()))
            return String(value);
        return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
            timeZone: "Asia/Tehran",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
        }).format(parsed);
    }
};
exports.NotificationTemplateEngineService = NotificationTemplateEngineService;
exports.NotificationTemplateEngineService = NotificationTemplateEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationTemplateEngineService);
//# sourceMappingURL=notification-template-engine.service.js.map