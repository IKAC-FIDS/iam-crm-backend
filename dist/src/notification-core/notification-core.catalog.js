"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TEMPLATE_VARIABLES = exports.NOTIFICATION_CHANNELS = exports.NOTIFICATION_EVENT_CATALOG = void 0;
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
    OPPORTUNITY: {
        STAGE_CHANGED: "OPPORTUNITY.STAGE_CHANGED",
    },
};
exports.NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "PUSH", "IN_APP"];
const commonVariables = [
    { key: "user.id", token: "{{user.id}}", label: "شناسه گیرنده", type: "string" },
    { key: "user.fullName", token: "{{user.fullName}}", label: "نام گیرنده", type: "string" },
    { key: "user.email", token: "{{user.email}}", label: "ایمیل گیرنده", type: "string" },
    { key: "actor.id", token: "{{actor.id}}", label: "شناسه انجام‌دهنده", type: "string" },
    { key: "actor.fullName", token: "{{actor.fullName}}", label: "نام انجام‌دهنده", type: "string" },
    { key: "organization.id", token: "{{organization.id}}", label: "شناسه سازمان", type: "string" },
    { key: "organization.name", token: "{{organization.name}}", label: "نام سازمان", type: "string" },
];
const meetingVariables = [
    { key: "meeting.id", token: "{{meeting.id}}", label: "شناسه جلسه", type: "string" },
    { key: "meeting.title", token: "{{meeting.title}}", label: "عنوان جلسه", type: "string" },
    { key: "meeting.startAt", token: "{{meeting.startAt}}", label: "زمان شروع جلسه", type: "date" },
    { key: "meeting.endAt", token: "{{meeting.endAt}}", label: "زمان پایان جلسه", type: "date" },
    { key: "meeting.location", token: "{{meeting.location}}", label: "مکان جلسه", type: "string" },
    { key: "meeting.agenda", token: "{{meeting.agenda}}", label: "دستور جلسه", type: "string" },
    { key: "meeting.company.id", token: "{{meeting.company.id}}", label: "شناسه شرکت جلسه", type: "string" },
    { key: "meeting.company.name", token: "{{meeting.company.name}}", label: "نام شرکت جلسه", type: "string" },
];
const taskVariables = [
    { key: "task.priority", token: "{{task.priority}}", label: "اولویت کار", type: "string" },
    { key: "task.dueDate", token: "{{task.dueDate}}", label: "مهلت کار", type: "date" },
    { key: "task.opportunity.title", token: "{{task.opportunity.title}}", label: "عنوان فرصت", type: "string" },
    { key: "task.id", token: "{{task.id}}", label: "شناسه کار", type: "string" },
    { key: "task.title", token: "{{task.title}}", label: "عنوان کار", type: "string" },
    { key: "task.description", token: "{{task.description}}", label: "شرح کار", type: "string" },
    { key: "task.dueAt", token: "{{task.dueAt}}", label: "مهلت کار", type: "date" },
    { key: "task.company.id", token: "{{task.company.id}}", label: "شناسه شرکت کار", type: "string" },
    { key: "task.company.name", token: "{{task.company.name}}", label: "نام شرکت کار", type: "string" },
];
const opportunityVariables = [
    { key: "opportunity.id", token: "{{opportunity.id}}", label: "شناسه فرصت", type: "string" },
    { key: "opportunity.title", token: "{{opportunity.title}}", label: "عنوان فرصت", type: "string" },
    { key: "opportunity.priority", token: "{{opportunity.priority}}", label: "اولویت فرصت", type: "string" },
    { key: "opportunity.probability", token: "{{opportunity.probability}}", label: "احتمال موفقیت فرصت", type: "string" },
    { key: "opportunity.stage", token: "{{opportunity.stage}}", label: "مرحله فعلی فرصت", type: "string" },
    { key: "opportunity.fromStage", token: "{{opportunity.fromStage}}", label: "مرحله قبلی فرصت", type: "string" },
    { key: "opportunity.toStage", token: "{{opportunity.toStage}}", label: "مرحله جدید فرصت", type: "string" },
];
exports.NOTIFICATION_TEMPLATE_VARIABLES = {
    "MEETING.CREATED": [...commonVariables, ...meetingVariables],
    "MEETING.UPDATED": [...commonVariables, ...meetingVariables],
    "MEETING.CANCELLED": [...commonVariables, ...meetingVariables],
    "TASK.ASSIGNED": [...commonVariables, ...taskVariables],
    "TASK.REASSIGNED": [...commonVariables, ...taskVariables],
    "TASK.COMPLETED": [...commonVariables, ...taskVariables],
    "OPPORTUNITY.STAGE_CHANGED": [...commonVariables, ...opportunityVariables],
};
//# sourceMappingURL=notification-core.catalog.js.map