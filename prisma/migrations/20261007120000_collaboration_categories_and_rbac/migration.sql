CREATE TYPE "CollaborationTopicCategory" AS ENUM ('TENDER', 'INTERNAL');

ALTER TABLE "collaboration_topics"
  ADD COLUMN "category" "CollaborationTopicCategory" NOT NULL DEFAULT 'INTERNAL';

CREATE INDEX "collaboration_topics_organizationId_category_archivedAt_idx"
  ON "collaboration_topics"("organizationId", "category", "archivedAt");

INSERT INTO "permissions" ("id", "action", "description", "name", "group", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'collaboration:view', 'مشاهده موضوع‌ها، کانال‌ها و گفتگوهای قابل دسترس', 'مشاهده مرکز همکاری', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:topic:create', 'ایجاد موضوع همکاری', 'ایجاد موضوع', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:topic:update', 'ویرایش موضوع همکاری', 'ویرایش موضوع', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:topic:delete', 'بایگانی موضوع و کانال‌های آن', 'بایگانی موضوع', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:channel:create', 'ایجاد کانال در موضوع‌های همکاری', 'ایجاد کانال', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:channel:update', 'ویرایش کانال همکاری', 'ویرایش کانال', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:channel:delete', 'بایگانی کانال همکاری', 'بایگانی کانال', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'collaboration:member:manage', 'افزودن و حذف اعضای کانال‌های قابل دسترس', 'مدیریت اعضای کانال', 'مرکز همکاری', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("action") DO UPDATE SET
  "description" = EXCLUDED."description",
  "name" = EXCLUDED."name",
  "group" = EXCLUDED."group",
  "isSystem" = true,
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("id", "role", "roleId", "permissionId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, r."baseRole", r."id", p."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."action" LIKE 'collaboration:%'
WHERE r."isSystem" = true
  AND (
    r."baseRole" = 'ADMIN'
    OR (r."baseRole" = 'MANAGER')
    OR (r."baseRole" IN ('REP', 'BOARDS') AND p."action" = 'collaboration:view')
  )
ON CONFLICT DO NOTHING;
