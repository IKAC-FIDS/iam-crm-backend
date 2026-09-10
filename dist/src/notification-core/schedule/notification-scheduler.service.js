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
var NotificationSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchedulerService = void 0;
exports.scheduledAt = scheduledAt;
exports.isDue = isDue;
exports.scheduledOccurrenceKey = scheduledOccurrenceKey;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_core_service_1 = require("../notification-core.service");
const notification_tenant_context_1 = require("../in-app/notification-tenant-context");
const MINUTE = 60_000;
const BATCH_SIZE = 500;
const OVERDUE_LOOKBACK_MINUTES = 525600;
function scheduledAt(sourceAt, offsetMinutes) {
    return new Date(sourceAt.getTime() + offsetMinutes * MINUTE);
}
function isDue(triggerAt, now, gracePeriodMinutes) {
    const lateMs = now.getTime() - triggerAt.getTime();
    return lateMs >= 0 && lateMs <= gracePeriodMinutes * MINUTE;
}
function scheduledOccurrenceKey(eventName, aggregateId, sourceAt, offsetMinutes) {
    return `${eventName}:${aggregateId}:${sourceAt.toISOString()}:OFFSET:${offsetMinutes}`;
}
let NotificationSchedulerService = NotificationSchedulerService_1 = class NotificationSchedulerService {
    constructor(prisma, core) {
        this.prisma = prisma;
        this.core = core;
        this.logger = new common_1.Logger(NotificationSchedulerService_1.name);
        this.running = false;
        this.lastRunAt = 0;
    }
    async tick() {
        if (!this.enabled())
            return;
        const intervalMs = this.intervalMinutes() * MINUTE;
        if (Date.now() - this.lastRunAt < intervalMs || this.running)
            return;
        this.running = true;
        this.lastRunAt = Date.now();
        const startedAt = Date.now();
        const metrics = { schedulesEvaluated: 0, candidateMeetings: 0, candidateTasks: 0, eventsPublished: 0, eventsSkipped: 0, duplicates: 0, errors: 0 };
        this.logger.log(JSON.stringify({ event: "scheduler.scan.started" }));
        try {
            const organizations = await this.prisma.organization.findMany({ where: { status: client_1.OrganizationStatus.ACTIVE }, select: { id: true } });
            for (const organization of organizations) {
                try {
                    await this.scanOrganization(organization.id, new Date(), metrics);
                }
                catch (error) {
                    metrics.errors += 1;
                    this.safeError("ORGANIZATION", organization.id, organization.id, undefined, error);
                }
            }
        }
        finally {
            this.running = false;
            this.logger.log(JSON.stringify({ event: "scheduler.scan.completed", ...metrics, durationMs: Date.now() - startedAt }));
        }
    }
    async scanOrganization(organizationId, now = new Date(), metrics = { schedulesEvaluated: 0, candidateMeetings: 0, candidateTasks: 0, eventsPublished: 0, eventsSkipped: 0, duplicates: 0, errors: 0 }) {
        const context = (0, notification_tenant_context_1.notificationTenantContext)(organizationId);
        const schedules = await this.prisma.withTenantTransaction(context, tx => tx.notificationSchedule.findMany({
            where: { organizationId, enabled: true, rule: { enabled: true } }, include: { rule: { select: { eventName: true } } }, orderBy: { createdAt: "asc" },
        }));
        for (const schedule of schedules) {
            metrics.schedulesEvaluated += 1;
            try {
                if (schedule.rule.eventName === "MEETING.REMINDER")
                    await this.scanMeetings(organizationId, schedule, schedule.rule.eventName, now, metrics);
                else if (schedule.rule.eventName === "TASK.DUE_SOON")
                    await this.scanDueSoonTasks(organizationId, schedule, schedule.rule.eventName, now, metrics);
                else if (schedule.rule.eventName === "TASK.OVERDUE")
                    await this.scanOverdueTasks(organizationId, schedule, schedule.rule.eventName, now, metrics);
                await this.prisma.withTenantTransaction(context, tx => tx.notificationSchedule.updateMany({ where: { id: schedule.id, organizationId }, data: { lastEvaluatedAt: now } }));
            }
            catch (error) {
                metrics.errors += 1;
                this.safeError("SCHEDULE", schedule.id, organizationId, schedule.rule.eventName, error);
            }
        }
        return metrics;
    }
    async scanMeetings(organizationId, schedule, eventName, now, metrics) {
        const sourceEnd = new Date(now.getTime() - schedule.offsetMinutes * MINUTE);
        const sourceStart = new Date(sourceEnd.getTime() - schedule.gracePeriodMinutes * MINUTE);
        const meetings = await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.meeting.findMany({
            where: { organizationId, status: client_1.MeetingStatus.SCHEDULED, startAt: { gt: now, gte: sourceStart, lte: sourceEnd } }, select: { id: true, startAt: true }, orderBy: { startAt: "asc" }, take: BATCH_SIZE,
        }));
        metrics.candidateMeetings += meetings.length;
        for (const meeting of meetings)
            await this.publishCandidate(organizationId, eventName, "MEETING", meeting.id, meeting.startAt, schedule, now, metrics);
    }
    async scanDueSoonTasks(organizationId, schedule, eventName, now, metrics) {
        const sourceEnd = new Date(now.getTime() - schedule.offsetMinutes * MINUTE);
        const sourceStart = new Date(sourceEnd.getTime() - schedule.gracePeriodMinutes * MINUTE);
        const tasks = await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.task.findMany({
            where: { organizationId, dueAt: { gt: now, gte: sourceStart, lte: sourceEnd }, status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS] } }, select: { id: true, dueAt: true }, orderBy: { dueAt: "asc" }, take: BATCH_SIZE,
        }));
        metrics.candidateTasks += tasks.length;
        for (const task of tasks)
            if (task.dueAt)
                await this.publishCandidate(organizationId, eventName, "TASK", task.id, task.dueAt, schedule, now, metrics);
    }
    async scanOverdueTasks(organizationId, schedule, eventName, now, metrics) {
        const lowerBound = new Date(now.getTime() - Math.min(schedule.gracePeriodMinutes, OVERDUE_LOOKBACK_MINUTES) * MINUTE);
        const tasks = await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.task.findMany({
            where: { organizationId, dueAt: { gte: lowerBound, lte: now }, status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS] } }, select: { id: true, dueAt: true }, orderBy: { dueAt: "asc" }, take: BATCH_SIZE,
        }));
        metrics.candidateTasks += tasks.length;
        for (const task of tasks)
            if (task.dueAt)
                await this.publishCandidate(organizationId, eventName, "TASK", task.id, task.dueAt, schedule, now, metrics);
    }
    async publishCandidate(organizationId, eventName, aggregateType, aggregateId, sourceAt, schedule, now, metrics) {
        const triggerAt = scheduledAt(sourceAt, schedule.offsetMinutes);
        if (!isDue(triggerAt, now, schedule.gracePeriodMinutes)) {
            metrics.eventsSkipped += 1;
            return;
        }
        const key = scheduledOccurrenceKey(eventName, aggregateId, sourceAt, schedule.offsetMinutes);
        try {
            const result = await this.core.publishAndEvaluate({ organizationId, eventName, aggregateType, aggregateId, actorId: null, occurredAt: triggerAt, idempotencyKey: key, payload: { schedule: { offsetMinutes: schedule.offsetMinutes, scheduledAt: triggerAt.toISOString(), detectedAt: now.toISOString() } } });
            if (result.duplicate)
                metrics.duplicates += 1;
            else
                metrics.eventsPublished += 1;
        }
        catch (error) {
            metrics.errors += 1;
            this.safeError(aggregateType, aggregateId, organizationId, eventName, error);
        }
    }
    enabled() { return !["false", "0", "off"].includes((process.env.NOTIFICATION_SCHEDULER_ENABLED ?? "true").toLowerCase()); }
    intervalMinutes() { const value = Number(process.env.NOTIFICATION_SCHEDULER_INTERVAL_MINUTES ?? 5); return Number.isInteger(value) && value >= 1 && value <= 60 ? value : 5; }
    safeError(entityType, entityId, organizationId, eventName, error) { this.logger.error(JSON.stringify({ event: "scheduler.entity.failed", organizationId, entityType, entityId, eventName, errorCategory: error instanceof Error ? error.name : "UNKNOWN" })); }
};
exports.NotificationSchedulerService = NotificationSchedulerService;
__decorate([
    (0, schedule_1.Interval)(60_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationSchedulerService.prototype, "tick", null);
exports.NotificationSchedulerService = NotificationSchedulerService = NotificationSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_core_service_1.NotificationCoreService])
], NotificationSchedulerService);
//# sourceMappingURL=notification-scheduler.service.js.map