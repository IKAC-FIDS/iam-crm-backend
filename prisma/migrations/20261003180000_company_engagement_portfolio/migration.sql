CREATE TYPE "CompanyEngagementStatus" AS ENUM (
  'ACTIVE',
  'NEEDS_ACTION',
  'NURTURE',
  'SNOOZED',
  'DORMANT',
  'DISQUALIFIED'
);

ALTER TABLE "companies"
  ADD COLUMN "engagementStatus" "CompanyEngagementStatus" NOT NULL DEFAULT 'NEEDS_ACTION',
  ADD COLUMN "engagementReason" TEXT,
  ADD COLUMN "nextReviewAt" TIMESTAMP(3),
  ADD COLUMN "engagementUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "engagementUpdatedById" TEXT;

-- Classify the existing portfolio once so the Operations workspace does not
-- start with every historical company in the actionable queue. New companies
-- continue to default to NEEDS_ACTION.
UPDATE "companies" AS company
SET "engagementStatus" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "opportunities" AS opportunity
    INNER JOIN "pipeline_stages" AS stage ON stage."id" = opportunity."stageId"
    WHERE opportunity."companyId" = company."id"
      AND opportunity."organizationId" = company."organizationId"
      AND opportunity."archivedAt" IS NULL
      AND stage."isTerminal" = false
  ) THEN 'ACTIVE'::"CompanyEngagementStatus"
  WHEN EXISTS (
    SELECT 1
    FROM "tasks" AS task
    WHERE task."companyId" = company."id"
      AND task."organizationId" = company."organizationId"
      AND task."status" IN ('TODO', 'IN_PROGRESS')
  ) THEN 'NEEDS_ACTION'::"CompanyEngagementStatus"
  ELSE 'DORMANT'::"CompanyEngagementStatus"
END;

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_engagementUpdatedById_fkey"
  FOREIGN KEY ("engagementUpdatedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "companies_organizationId_engagementStatus_nextReviewAt_idx"
  ON "companies"("organizationId", "engagementStatus", "nextReviewAt");

CREATE TABLE "company_user_preferences" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_user_preferences_organizationId_userId_companyId_key"
  ON "company_user_preferences"("organizationId", "userId", "companyId");
CREATE INDEX "company_user_preferences_organizationId_userId_isPinned_idx"
  ON "company_user_preferences"("organizationId", "userId", "isPinned");

ALTER TABLE "company_user_preferences"
  ADD CONSTRAINT "company_user_preferences_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_user_preferences"
  ADD CONSTRAINT "company_user_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_user_preferences"
  ADD CONSTRAINT "company_user_preferences_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
