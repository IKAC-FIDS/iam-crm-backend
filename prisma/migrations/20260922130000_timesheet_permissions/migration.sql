INSERT INTO "permissions" ("id", "action", "name", "description", "group", "isSystem", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'timesheet:view', 'مشاهده کارکرد شخصی', 'مشاهده کارکرد ثبت‌شده خود کاربر', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'timesheet:manage', 'مدیریت کارکرد شخصی', 'ثبت و ویرایش و ارسال کارکرد خود کاربر', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'timesheet:approve', 'تأیید کارکرد تیم', 'تصمیم‌گیری کارکرد اعضای تیم تحت مدیریت', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'timesheet:view-organization', 'مشاهده کارکرد سازمان', 'مشاهده کارکرد همه اعضای سازمان', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'timesheet:approve-organization', 'تأیید کارکرد سازمان', 'تصمیم‌گیری کارکرد همه اعضای سازمان', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'leave:view', 'مشاهده مرخصی شخصی', 'مشاهده درخواست‌های مرخصی خود کاربر', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'leave:manage', 'مدیریت مرخصی شخصی', 'ثبت و ویرایش و ارسال درخواست مرخصی', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'leave:approve', 'تأیید مرخصی تیم', 'تصمیم‌گیری مرخصی اعضای تیم تحت مدیریت', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'leave:view-organization', 'مشاهده مرخصی سازمان', 'مشاهده مرخصی همه اعضای سازمان', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'leave:approve-organization', 'تأیید مرخصی سازمان', 'تصمیم‌گیری مرخصی همه اعضای سازمان', 'کارکرد و مرخصی', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("action") DO UPDATE SET "name"=EXCLUDED."name", "description"=EXCLUDED."description", "group"=EXCLUDED."group", "isSystem"=true, "isActive"=true, "updatedAt"=CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" ("id", "role", "roleId", "permissionId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, r."baseRole", r."id", p."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."isSystem" = true AND (
  (r."code" IN ('REP','MANAGER','ADMIN') AND p."action" IN ('timesheet:view','timesheet:manage','leave:view','leave:manage')) OR
  (r."code" IN ('MANAGER','ADMIN') AND p."action" IN ('timesheet:approve','leave:approve')) OR
  (r."code" = 'ADMIN' AND p."action" IN ('timesheet:view-organization','timesheet:approve-organization','leave:view-organization','leave:approve-organization'))
) ON CONFLICT DO NOTHING;
