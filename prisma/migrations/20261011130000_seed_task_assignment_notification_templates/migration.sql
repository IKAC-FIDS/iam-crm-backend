-- Assignment rules are allowed to select IN_APP and DESKTOP_PUSH, but older
-- organizations may not have a template for either channel. In that state the
-- rule evaluation is unresolved and no delivery is queued. Seed conservative
-- defaults only when the organization has no active template for the exact
-- event/channel/locale. Existing active custom templates remain authoritative.
DO $$
DECLARE
  tenant RECORD;
BEGIN
  FOR tenant IN SELECT "id", "locale" FROM "organizations" LOOP
    -- notification_templates uses FORCE ROW LEVEL SECURITY. Set the same
    -- transaction-local tenant context used by the application before touching
    -- each organization's rows; never disable or bypass the policy.
    PERFORM set_config('app.current_organization_id', tenant."id", TRUE);

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
      tenant."id",
      defaults."eventName",
      defaults."channel"::"NotificationChannel",
      tenant."locale",
      defaults."subject",
      defaults."body",
      TRUE,
      COALESCE((
        SELECT MAX(existing."version")
        FROM "notification_templates" existing
        WHERE existing."organizationId" = tenant."id"
          AND existing."eventName" = defaults."eventName"
          AND existing."channel" = defaults."channel"::"NotificationChannel"
          AND existing."locale" = tenant."locale"
      ), 0) + 1,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM (
      VALUES
        ('TASK.ASSIGNED', 'IN_APP', 'کار جدیدی به شما ارجاع شد', '{{task.title}}'),
        ('TASK.ASSIGNED', 'DESKTOP_PUSH', 'کار جدیدی به شما ارجاع شد', '{{task.title}}'),
        ('TASK.REASSIGNED', 'IN_APP', 'کاری به شما ارجاع شد', '{{task.title}}'),
        ('TASK.REASSIGNED', 'DESKTOP_PUSH', 'کاری به شما ارجاع شد', '{{task.title}}')
    ) AS defaults("eventName", "channel", "subject", "body")
    WHERE NOT EXISTS (
      SELECT 1
      FROM "notification_templates" active_template
      WHERE active_template."organizationId" = tenant."id"
        AND active_template."eventName" = defaults."eventName"
        AND active_template."channel" = defaults."channel"::"NotificationChannel"
        AND active_template."locale" = tenant."locale"
        AND active_template."isActive" = TRUE
    );
  END LOOP;
END $$;
