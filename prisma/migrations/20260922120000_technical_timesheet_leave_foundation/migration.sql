-- Technical Timesheet & Leave Management database foundation.
-- This migration is additive. It intentionally contains no data backfill.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "TimeEntryType" AS ENUM ('REGULAR', 'OVERTIME');
CREATE TYPE "TimeEntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'OTHER');
CREATE TYPE "LeaveUnit" AS ENUM ('FULL_DAY', 'HALF_DAY', 'HOURLY');
CREATE TYPE "LeaveStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "WorkScheduleScope" AS ENUM ('ORGANIZATION', 'TEAM', 'USER');
CREATE TYPE "TimesheetApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'RESUBMITTED');

-- Composite candidate keys make tenant equality part of every sensitive FK.
-- The leading primary key is already unique, so these indexes cannot discover
-- duplicate production data and do not change row semantics.
CREATE UNIQUE INDEX "users_id_organizationId_key" ON "users"("id", "organizationId");
CREATE UNIQUE INDEX "teams_id_organizationId_key" ON "teams"("id", "organizationId");
CREATE UNIQUE INDEX "companies_id_organizationId_key" ON "companies"("id", "organizationId");
CREATE UNIQUE INDEX "tasks_id_organizationId_key" ON "tasks"("id", "organizationId");
CREATE UNIQUE INDEX "organization_memberships_id_organizationId_key" ON "organization_memberships"("id", "organizationId");
CREATE UNIQUE INDEX "organization_memberships_id_organizationId_userId_key" ON "organization_memberships"("id", "organizationId", "userId");

CREATE TABLE "timesheet_entries" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "teamId" TEXT,
  "teamCodeSnapshot" TEXT,
  "teamNameSnapshot" TEXT,
  "workDate" DATE NOT NULL,
  "startMinute" INTEGER,
  "endMinute" INTEGER,
  "spansMidnight" BOOLEAN NOT NULL DEFAULT false,
  "durationMinutes" INTEGER NOT NULL,
  "breakMinutes" INTEGER NOT NULL DEFAULT 0,
  "type" "TimeEntryType" NOT NULL,
  "description" TEXT,
  "status" "TimeEntryStatus" NOT NULL DEFAULT 'DRAFT',
  "taskId" TEXT,
  "companyId" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedByMembershipId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "timesheet_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timesheet_entries_duration_check" CHECK ("durationMinutes" > 0),
  CONSTRAINT "timesheet_entries_break_check" CHECK ("breakMinutes" >= 0),
  CONSTRAINT "timesheet_entries_local_time_check" CHECK (
    (("startMinute" IS NULL) = ("endMinute" IS NULL))
    AND ("startMinute" IS NULL OR "startMinute" BETWEEN 0 AND 1439)
    AND ("endMinute" IS NULL OR "endMinute" BETWEEN 0 AND 1439)
    AND (NOT "spansMidnight" OR "startMinute" IS NOT NULL)
    AND ("startMinute" IS NULL OR "spansMidnight" OR "endMinute" > "startMinute")
    AND ("startMinute" IS NULL OR NOT "spansMidnight" OR "endMinute" <= "startMinute")
  ),
  CONSTRAINT "timesheet_entries_review_check" CHECK (
    ("status" = 'REJECTED' AND NULLIF(BTRIM("rejectionReason"), '') IS NOT NULL)
    OR ("status" <> 'REJECTED' AND "rejectionReason" IS NULL)
  )
);

CREATE TABLE "leave_requests" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "teamId" TEXT,
  "teamCodeSnapshot" TEXT,
  "teamNameSnapshot" TEXT,
  "type" "LeaveType" NOT NULL,
  "unit" "LeaveUnit" NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "startMinute" INTEGER,
  "endMinute" INTEGER,
  "requestedMinutes" INTEGER,
  "reason" TEXT,
  "status" "LeaveStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "reviewedByMembershipId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "leave_requests_date_order_check" CHECK ("endDate" >= "startDate"),
  CONSTRAINT "leave_requests_duration_check" CHECK (
    ("status" = 'DRAFT' AND ("requestedMinutes" IS NULL OR "requestedMinutes" > 0))
    OR ("status" <> 'DRAFT' AND "requestedMinutes" > 0)
  ),
  CONSTRAINT "leave_requests_unit_check" CHECK (
    ("unit" = 'HOURLY'
      AND "startDate" = "endDate"
      AND "startMinute" BETWEEN 0 AND 1439
      AND "endMinute" BETWEEN 1 AND 1440
      AND "endMinute" > "startMinute")
    OR ("unit" = 'HALF_DAY'
      AND "startDate" = "endDate"
      AND "startMinute" IS NULL
      AND "endMinute" IS NULL)
    OR ("unit" = 'FULL_DAY'
      AND "startMinute" IS NULL
      AND "endMinute" IS NULL)
  ),
  CONSTRAINT "leave_requests_review_check" CHECK (
    ("status" = 'REJECTED' AND NULLIF(BTRIM("rejectionReason"), '') IS NOT NULL)
    OR ("status" <> 'REJECTED' AND "rejectionReason" IS NULL)
  )
);

CREATE TABLE "work_schedules" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "scope" "WorkScheduleScope" NOT NULL,
  "teamId" TEXT,
  "userId" TEXT,
  "membershipId" TEXT,
  "timezoneOverride" TEXT,
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_schedules_date_order_check" CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom"),
  CONSTRAINT "work_schedules_scope_check" CHECK (
    ("scope" = 'ORGANIZATION' AND "teamId" IS NULL AND "membershipId" IS NULL AND "userId" IS NULL)
    OR ("scope" = 'TEAM' AND "teamId" IS NOT NULL AND "membershipId" IS NULL AND "userId" IS NULL)
    OR ("scope" = 'USER' AND "teamId" IS NULL AND "membershipId" IS NOT NULL AND "userId" IS NOT NULL)
  )
);

CREATE TABLE "work_schedule_days" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "regularMinutes" INTEGER NOT NULL,
  CONSTRAINT "work_schedule_days_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_schedule_days_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "work_schedule_days_minutes_check" CHECK ("regularMinutes" > 0 AND "regularMinutes" <= 1440)
);

CREATE TABLE "timesheet_approval_histories" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "action" "TimesheetApprovalAction" NOT NULL,
  "timesheetEntryId" TEXT,
  "leaveRequestId" TEXT,
  "actorMembershipId" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "timesheet_approval_histories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "timesheet_approval_histories_target_check" CHECK (
    ("timesheetEntryId" IS NOT NULL)::integer + ("leaveRequestId" IS NOT NULL)::integer = 1
  ),
  CONSTRAINT "timesheet_approval_histories_reason_check" CHECK (
    "action" <> 'REJECTED' OR NULLIF(BTRIM("reason"), '') IS NOT NULL
  )
);

CREATE UNIQUE INDEX "timesheet_entries_id_organizationId_key" ON "timesheet_entries"("id", "organizationId");
CREATE INDEX "timesheet_entries_organizationId_userId_workDate_idx" ON "timesheet_entries"("organizationId", "userId", "workDate");
CREATE INDEX "timesheet_entries_organizationId_teamId_workDate_idx" ON "timesheet_entries"("organizationId", "teamId", "workDate");
CREATE INDEX "timesheet_entries_organizationId_status_type_workDate_idx" ON "timesheet_entries"("organizationId", "status", "type", "workDate");
CREATE INDEX "timesheet_entries_organizationId_taskId_idx" ON "timesheet_entries"("organizationId", "taskId");
CREATE INDEX "timesheet_entries_organizationId_companyId_idx" ON "timesheet_entries"("organizationId", "companyId");

CREATE UNIQUE INDEX "leave_requests_id_organizationId_key" ON "leave_requests"("id", "organizationId");
CREATE INDEX "leave_requests_organizationId_userId_startDate_endDate_idx" ON "leave_requests"("organizationId", "userId", "startDate", "endDate");
CREATE INDEX "leave_requests_organizationId_teamId_startDate_endDate_idx" ON "leave_requests"("organizationId", "teamId", "startDate", "endDate");
CREATE INDEX "leave_requests_organizationId_status_startDate_idx" ON "leave_requests"("organizationId", "status", "startDate");

CREATE UNIQUE INDEX "work_schedules_id_organizationId_key" ON "work_schedules"("id", "organizationId");
CREATE INDEX "work_schedules_organizationId_scope_effectiveFrom_effectiveTo_idx" ON "work_schedules"("organizationId", "scope", "effectiveFrom", "effectiveTo");
CREATE INDEX "work_schedules_organizationId_teamId_effectiveFrom_idx" ON "work_schedules"("organizationId", "teamId", "effectiveFrom");
CREATE INDEX "work_schedules_organizationId_membershipId_effectiveFrom_idx" ON "work_schedules"("organizationId", "membershipId", "effectiveFrom");

CREATE UNIQUE INDEX "work_schedule_days_scheduleId_weekday_key" ON "work_schedule_days"("scheduleId", "weekday");
CREATE INDEX "work_schedule_days_organizationId_scheduleId_idx" ON "work_schedule_days"("organizationId", "scheduleId");

CREATE INDEX "timesheet_approval_histories_organizationId_timesheetEntryId_createdAt_idx" ON "timesheet_approval_histories"("organizationId", "timesheetEntryId", "createdAt");
CREATE INDEX "timesheet_approval_histories_organizationId_leaveRequestId_createdAt_idx" ON "timesheet_approval_histories"("organizationId", "leaveRequestId", "createdAt");
CREATE INDEX "timesheet_approval_histories_organizationId_actorMembershipId_createdAt_idx" ON "timesheet_approval_histories"("organizationId", "actorMembershipId", "createdAt");

-- Same-level effective ranges cannot overlap. Resolution across levels is
-- deterministic: USER, then TEAM, then ORGANIZATION.
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_organization_no_overlap"
  EXCLUDE USING gist (
    "organizationId" WITH =,
    daterange("effectiveFrom", COALESCE("effectiveTo", 'infinity'::date), '[]') WITH &&
  ) WHERE ("scope" = 'ORGANIZATION');

ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_team_no_overlap"
  EXCLUDE USING gist (
    "organizationId" WITH =,
    "teamId" WITH =,
    daterange("effectiveFrom", COALESCE("effectiveTo", 'infinity'::date), '[]') WITH &&
  ) WHERE ("scope" = 'TEAM');

ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_user_no_overlap"
  EXCLUDE USING gist (
    "organizationId" WITH =,
    "membershipId" WITH =,
    daterange("effectiveFrom", COALESCE("effectiveTo", 'infinity'::date), '[]') WITH &&
  ) WHERE ("scope" = 'USER');

ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_membership_tenant_fkey" FOREIGN KEY ("membershipId", "organizationId", "userId") REFERENCES "organization_memberships"("id", "organizationId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_team_tenant_fkey" FOREIGN KEY ("teamId", "organizationId") REFERENCES "teams"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_task_tenant_fkey" FOREIGN KEY ("taskId", "organizationId") REFERENCES "tasks"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_company_tenant_fkey" FOREIGN KEY ("companyId", "organizationId") REFERENCES "companies"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_reviewer_tenant_fkey" FOREIGN KEY ("reviewedByMembershipId", "organizationId") REFERENCES "organization_memberships"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_membership_tenant_fkey" FOREIGN KEY ("membershipId", "organizationId", "userId") REFERENCES "organization_memberships"("id", "organizationId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_team_tenant_fkey" FOREIGN KEY ("teamId", "organizationId") REFERENCES "teams"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewer_tenant_fkey" FOREIGN KEY ("reviewedByMembershipId", "organizationId") REFERENCES "organization_memberships"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_team_tenant_fkey" FOREIGN KEY ("teamId", "organizationId") REFERENCES "teams"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_membership_tenant_fkey" FOREIGN KEY ("membershipId", "organizationId", "userId") REFERENCES "organization_memberships"("id", "organizationId", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "work_schedule_days" ADD CONSTRAINT "work_schedule_days_schedule_tenant_fkey" FOREIGN KEY ("scheduleId", "organizationId") REFERENCES "work_schedules"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "timesheet_approval_histories" ADD CONSTRAINT "timesheet_approval_histories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_approval_histories" ADD CONSTRAINT "timesheet_approval_histories_timesheet_tenant_fkey" FOREIGN KEY ("timesheetEntryId", "organizationId") REFERENCES "timesheet_entries"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_approval_histories" ADD CONSTRAINT "timesheet_approval_histories_leave_tenant_fkey" FOREIGN KEY ("leaveRequestId", "organizationId") REFERENCES "leave_requests"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_approval_histories" ADD CONSTRAINT "timesheet_approval_histories_actor_tenant_fkey" FOREIGN KEY ("actorMembershipId", "organizationId") REFERENCES "organization_memberships"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Fail closed when the transaction-local tenant context is absent.
ALTER TABLE "timesheet_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timesheet_entries" FORCE ROW LEVEL SECURITY;
CREATE POLICY "timesheet_entries_tenant_isolation" ON "timesheet_entries"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leave_requests" FORCE ROW LEVEL SECURITY;
CREATE POLICY "leave_requests_tenant_isolation" ON "leave_requests"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "work_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_schedules" FORCE ROW LEVEL SECURITY;
CREATE POLICY "work_schedules_tenant_isolation" ON "work_schedules"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));

ALTER TABLE "work_schedule_days" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_schedule_days" FORCE ROW LEVEL SECURITY;
CREATE POLICY "work_schedule_days_tenant_isolation" ON "work_schedule_days"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK (
    "organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')
    AND EXISTS (
      SELECT 1 FROM "work_schedules" schedule
      WHERE schedule."id" = "work_schedule_days"."scheduleId"
        AND schedule."organizationId" = "work_schedule_days"."organizationId"
    )
  );

ALTER TABLE "timesheet_approval_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timesheet_approval_histories" FORCE ROW LEVEL SECURITY;
CREATE POLICY "timesheet_approval_histories_tenant_isolation" ON "timesheet_approval_histories"
  USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
  WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));
