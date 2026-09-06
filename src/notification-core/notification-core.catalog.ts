export const NOTIFICATION_EVENT_CATALOG = {
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
} as const

export type NotificationEventName =
  | (typeof NOTIFICATION_EVENT_CATALOG.MEETING)[keyof typeof NOTIFICATION_EVENT_CATALOG.MEETING]
  | (typeof NOTIFICATION_EVENT_CATALOG.TASK)[keyof typeof NOTIFICATION_EVENT_CATALOG.TASK]

export const NOTIFICATION_CHANNELS = ["EMAIL", "SMS", "PUSH", "IN_APP"] as const
export type NotificationChannelCode = (typeof NOTIFICATION_CHANNELS)[number]

export type NotificationTemplateVariable = {
  key: string
  token: string
  label: string
  type: "string" | "date"
}

const commonVariables: NotificationTemplateVariable[] = [
  { key: "user.id", token: "{{user.id}}", label: "شناسه گیرنده", type: "string" },
  { key: "user.fullName", token: "{{user.fullName}}", label: "نام گیرنده", type: "string" },
  { key: "user.email", token: "{{user.email}}", label: "ایمیل گیرنده", type: "string" },
  { key: "actor.id", token: "{{actor.id}}", label: "شناسه انجام‌دهنده", type: "string" },
  { key: "actor.fullName", token: "{{actor.fullName}}", label: "نام انجام‌دهنده", type: "string" },
  { key: "organization.id", token: "{{organization.id}}", label: "شناسه سازمان", type: "string" },
  { key: "organization.name", token: "{{organization.name}}", label: "نام سازمان", type: "string" },
]

const meetingVariables: NotificationTemplateVariable[] = [
  { key: "meeting.id", token: "{{meeting.id}}", label: "شناسه جلسه", type: "string" },
  { key: "meeting.title", token: "{{meeting.title}}", label: "عنوان جلسه", type: "string" },
  { key: "meeting.startAt", token: "{{meeting.startAt}}", label: "زمان شروع جلسه", type: "date" },
  { key: "meeting.endAt", token: "{{meeting.endAt}}", label: "زمان پایان جلسه", type: "date" },
  { key: "meeting.location", token: "{{meeting.location}}", label: "مکان جلسه", type: "string" },
  { key: "meeting.agenda", token: "{{meeting.agenda}}", label: "دستور جلسه", type: "string" },
  { key: "meeting.company.id", token: "{{meeting.company.id}}", label: "شناسه شرکت جلسه", type: "string" },
  { key: "meeting.company.name", token: "{{meeting.company.name}}", label: "نام شرکت جلسه", type: "string" },
]

const taskVariables: NotificationTemplateVariable[] = [
  { key: "task.id", token: "{{task.id}}", label: "شناسه کار", type: "string" },
  { key: "task.title", token: "{{task.title}}", label: "عنوان کار", type: "string" },
  { key: "task.description", token: "{{task.description}}", label: "شرح کار", type: "string" },
  { key: "task.dueAt", token: "{{task.dueAt}}", label: "مهلت کار", type: "date" },
  { key: "task.company.id", token: "{{task.company.id}}", label: "شناسه شرکت کار", type: "string" },
  { key: "task.company.name", token: "{{task.company.name}}", label: "نام شرکت کار", type: "string" },
]

export const NOTIFICATION_TEMPLATE_VARIABLES: Record<NotificationEventName, NotificationTemplateVariable[]> = {
  "MEETING.CREATED": [...commonVariables, ...meetingVariables],
  "MEETING.UPDATED": [...commonVariables, ...meetingVariables],
  "MEETING.CANCELLED": [...commonVariables, ...meetingVariables],
  "TASK.ASSIGNED": [...commonVariables, ...taskVariables],
  "TASK.REASSIGNED": [...commonVariables, ...taskVariables],
  "TASK.COMPLETED": [...commonVariables, ...taskVariables],
}
