"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_SCHEDULE_CATALOG = void 0;
exports.scheduleDefinition = scheduleDefinition;
const client_1 = require("@prisma/client");
exports.NOTIFICATION_SCHEDULE_CATALOG = {
    "MEETING.REMINDER": {
        eventName: "MEETING.REMINDER", label: "یادآوری جلسه", aggregateType: "MEETING",
        sourceField: "meeting.startAt", scheduleType: client_1.NotificationScheduleType.RELATIVE,
        triggerModes: [client_1.NotificationScheduleTriggerMode.BEFORE],
        suggestedOffsetsMinutes: [-10080, -1440, -120, -60, -30, -15], defaultGracePeriodMinutes: 30,
    },
    "TASK.DUE_SOON": {
        eventName: "TASK.DUE_SOON", label: "نزدیک‌شدن سررسید کار", aggregateType: "TASK",
        sourceField: "task.dueAt", scheduleType: client_1.NotificationScheduleType.RELATIVE,
        triggerModes: [client_1.NotificationScheduleTriggerMode.BEFORE],
        suggestedOffsetsMinutes: [-1440, -720, -360, -120, -60, -30, -15], defaultGracePeriodMinutes: 60,
    },
    "TASK.OVERDUE": {
        eventName: "TASK.OVERDUE", label: "سررسید گذشته کار", aggregateType: "TASK",
        sourceField: "task.dueAt", scheduleType: client_1.NotificationScheduleType.OVERDUE,
        triggerModes: [client_1.NotificationScheduleTriggerMode.AT_OR_AFTER],
        suggestedOffsetsMinutes: [0], defaultGracePeriodMinutes: 525600,
    },
};
function scheduleDefinition(eventName) { return exports.NOTIFICATION_SCHEDULE_CATALOG[eventName]; }
//# sourceMappingURL=notification-schedule.catalog.js.map