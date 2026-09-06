"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_CHANNELS = exports.NOTIFICATION_EVENT_CATALOG = void 0;
exports.NOTIFICATION_EVENT_CATALOG = {
    MEETING: {
        CREATED: "MEETING.CREATED",
        UPDATED: "MEETING.UPDATED",
        CANCELLED: "MEETING.CANCELLED",
    },
    TASK: {
        ASSIGNED: "TASK.ASSIGNED",
        REASSIGNED: "TASK.REASSIGNED",
        COMPLETED: "TASK.COMPLETED",
    },
};
exports.NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "PUSH", "IN_APP"];
//# sourceMappingURL=notification-core.catalog.js.map