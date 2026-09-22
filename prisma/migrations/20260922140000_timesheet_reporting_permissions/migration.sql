-- Register capabilities only. Do not grant broader visibility or assign roles implicitly.
INSERT INTO "permissions" ("id", "action", "name", "description", "group", "isSystem", "isActive", "createdAt", "updatedAt") VALUES
 (gen_random_uuid()::text, 'timesheet:report', 'گزارش کارکرد', 'گزارش کارکرد در محدوده مجاز', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 (gen_random_uuid()::text, 'timesheet:export', 'خروجی کارکرد', 'خروجی کارکرد در محدوده مجاز', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("action") DO NOTHING;
