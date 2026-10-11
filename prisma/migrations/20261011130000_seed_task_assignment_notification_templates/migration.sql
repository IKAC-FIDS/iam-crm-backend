-- Assignment rules are allowed to select IN_APP and DESKTOP_PUSH, but older
-- organizations may not have a template for either channel. In that state the
-- rule evaluation is unresolved and no delivery is queued. Seed conservative
-- defaults only when the organization has no active template for the exact
-- event/channel/locale. Existing active custom templates remain authoritative.
INSERT INTO "notification_templates" (
  "id",
  "organizationId",
  "eventName",
  "channel",
  "locale",
  "subject",
  "body",
  "isActive",
  "version",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  organization."id",
  defaults."eventName",
  defaults."channel"::"NotificationChannel",
  organization."locale",
  defaults."subject",
  defaults."body",
  TRUE,
  COALESCE((
    SELECT MAX(existing."version")
    FROM "notification_templates" existing
    WHERE existing."organizationId" = organization."id"
      AND existing."eventName" = defaults."eventName"
      AND existing."channel" = defaults."channel"::"NotificationChannel"
      AND existing."locale" = organization."locale"
  ), 0) + 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "organizations" organization
CROSS JOIN (
  VALUES
    ('TASK.ASSIGNED', 'IN_APP', 'کار جدیدی به شما ارجاع شد', '{{task.title}}'),
    ('TASK.ASSIGNED', 'DESKTOP_PUSH', 'کار جدیدی به شما ارجاع شد', '{{task.title}}'),
    ('TASK.REASSIGNED', 'IN_APP', 'کاری به شما ارجاع شد', '{{task.title}}'),
    ('TASK.REASSIGNED', 'DESKTOP_PUSH', 'کاری به شما ارجاع شد', '{{task.title}}')
) AS defaults("eventName", "channel", "subject", "body")
WHERE NOT EXISTS (
  SELECT 1
  FROM "notification_templates" active_template
  WHERE active_template."organizationId" = organization."id"
    AND active_template."eventName" = defaults."eventName"
    AND active_template."channel" = defaults."channel"::"NotificationChannel"
    AND active_template."locale" = organization."locale"
    AND active_template."isActive" = TRUE
);
