"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPolicyContextBuilder = void 0;
const common_1 = require("@nestjs/common");
let NotificationPolicyContextBuilder = class NotificationPolicyContextBuilder {
    async build(event, db) {
        const payload = event.payload && typeof event.payload === "object" && !Array.isArray(event.payload) ? event.payload : {};
        const actor = event.actorId ? await db.user.findFirst({ where: { id: event.actorId, organizationId: event.organizationId }, select: { id: true, roleId: true, teamId: true } }) : null;
        const schedule = payload.schedule && typeof payload.schedule === "object" && !Array.isArray(payload.schedule) ? payload.schedule : null;
        const context = { event: { name: event.eventName }, actor: { id: actor?.id ?? event.actorId ?? null, roleId: actor?.roleId ?? null, teamId: actor?.teamId ?? null }, organization: { id: event.organizationId }, task: null, meeting: null, opportunity: null, schedule: schedule ? { offsetMinutes: typeof schedule.offsetMinutes === "number" ? schedule.offsetMinutes : 0, scheduledAt: this.text(schedule.scheduledAt) ?? event.occurredAt.toISOString(), detectedAt: this.text(schedule.detectedAt) } : null };
        if (event.aggregateType === "TASK") {
            const task = await db.task.findFirst({ where: { id: event.aggregateId, organizationId: event.organizationId }, select: { id: true, title: true, priority: true, status: true, dueAt: true, assignedToId: true, teamId: true, createdById: true } });
            if (task)
                context.task = { id: task.id, title: task.title, priority: task.priority, status: task.status, dueAt: task.dueAt?.toISOString() ?? null, assigneeId: task.assignedToId, teamId: task.teamId, creatorId: task.createdById };
        }
        else if (event.aggregateType === "MEETING") {
            const meeting = await db.meeting.findFirst({ where: { id: event.aggregateId, organizationId: event.organizationId }, select: { id: true, title: true, status: true, startAt: true, organizerId: true, type: { select: { code: true } } } });
            if (meeting)
                context.meeting = { id: meeting.id, title: meeting.title, type: meeting.type?.code ?? null, status: meeting.status, startAt: meeting.startAt.toISOString(), organizerId: meeting.organizerId };
        }
        else if (event.aggregateType === "OPPORTUNITY") {
            const opportunity = await db.opportunity.findFirst({ where: { id: event.aggregateId, organizationId: event.organizationId }, select: { id: true, title: true, priority: true, probability: true, ownerId: true, stage: { select: { code: true } } } });
            context.opportunity = { id: opportunity?.id ?? event.aggregateId, title: opportunity?.title ?? null, priority: opportunity?.priority ?? null, probability: opportunity?.probability ?? null, ownerId: opportunity?.ownerId ?? null, stage: opportunity?.stage.code ?? null, fromStage: this.text(payload.fromStage), toStage: this.text(payload.toStage) ?? opportunity?.stage.code ?? null };
        }
        return context;
    }
    text(value) { return typeof value === "string" && value.length <= 500 ? value : null; }
};
exports.NotificationPolicyContextBuilder = NotificationPolicyContextBuilder;
exports.NotificationPolicyContextBuilder = NotificationPolicyContextBuilder = __decorate([
    (0, common_1.Injectable)()
], NotificationPolicyContextBuilder);
//# sourceMappingURL=notification-policy-context-builder.service.js.map