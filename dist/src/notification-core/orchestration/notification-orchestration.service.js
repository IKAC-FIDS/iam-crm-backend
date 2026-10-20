"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationOrchestrationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notification_time_window_1 = require("./notification-time-window");
let NotificationOrchestrationService = class NotificationOrchestrationService {
    async decide(event, rule, recipientUserId, channel, db, now = new Date()) {
        const preference = await db.notificationPreference.findUnique({ where: { organizationId_userId_eventName_channel: { organizationId: event.organizationId, userId: recipientUserId, eventName: event.eventName, channel } }, select: { enabled: true } });
        if (!rule.mandatory && preference?.enabled === false)
            return { disposition: "SUPPRESSED_PREFERENCE", status: client_1.NotificationDeliveryStatus.SKIPPED, nextAttemptAt: null, deferredUntil: null };
        const critical = rule.deliveryPriority === client_1.NotificationPriority.CRITICAL;
        let resumeAt = null;
        const quiet = await db.notificationQuietHoursPolicy.findUnique({ where: { organizationId: event.organizationId } });
        if (quiet?.enabled && quiet.channels.includes(channel)) {
            const window = (0, notification_time_window_1.quietHoursDecision)(now, quiet.startTime, quiet.endTime, quiet.timezone);
            if (window.active && !(critical && quiet.allowCritical)) {
                if (quiet.mode === client_1.NotificationQuietHoursMode.SUPPRESS)
                    return { disposition: "SUPPRESSED_QUIET_HOURS", status: client_1.NotificationDeliveryStatus.SKIPPED, nextAttemptAt: null, deferredUntil: null };
                resumeAt = window.resumeAt;
            }
        }
        if (!critical && rule.digestPolicyId && channel === client_1.NotificationChannel.EMAIL) {
            const policy = await db.notificationDigestPolicy.findFirst({ where: { id: rule.digestPolicyId, organizationId: event.organizationId, enabled: true, eventNames: { has: event.eventName }, channels: { has: channel } } });
            if (policy) {
                const window = (0, notification_time_window_1.dailyDigestWindow)(now, policy.sendTime, policy.timezone);
                const scheduledFor = resumeAt && resumeAt > window.scheduledFor ? resumeAt : window.scheduledFor;
                return { disposition: "DIGESTED", status: client_1.NotificationDeliveryStatus.PENDING, nextAttemptAt: scheduledFor, deferredUntil: scheduledFor, digest: { policyId: policy.id, windowStart: window.windowStart, scheduledFor } };
            }
        }
        if (resumeAt)
            return { disposition: "DEFERRED_QUIET_HOURS", status: client_1.NotificationDeliveryStatus.PENDING, nextAttemptAt: resumeAt, deferredUntil: resumeAt };
        return { disposition: "DIRECT", status: client_1.NotificationDeliveryStatus.PENDING, nextAttemptAt: null, deferredUntil: null };
    }
};
exports.NotificationOrchestrationService = NotificationOrchestrationService;
exports.NotificationOrchestrationService = NotificationOrchestrationService = __decorate([
    (0, common_1.Injectable)()
], NotificationOrchestrationService);
//# sourceMappingURL=notification-orchestration.service.js.map