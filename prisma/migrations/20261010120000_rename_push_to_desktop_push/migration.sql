-- The existing PUSH channel already uses standard Web Push. Rename it in place so
-- existing rules, templates, deliveries and policies retain their associations.
ALTER TYPE "NotificationChannel" RENAME VALUE 'PUSH' TO 'DESKTOP_PUSH';
