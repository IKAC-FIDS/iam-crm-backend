CREATE TYPE "PersonalTodoStatus" AS ENUM ('TODO', 'DONE', 'CANCELLED');
CREATE TYPE "PersonalTodoRecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

ALTER TYPE "NotificationType" ADD VALUE 'PERSONAL_TODO_REMINDER';
ALTER TYPE "NotificationEntityType" ADD VALUE 'PERSONAL_TODO';

CREATE TABLE "personal_todos" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "note" TEXT,
  "status" "PersonalTodoStatus" NOT NULL DEFAULT 'TODO',
  "dueAt" TIMESTAMP(3),
  "reminderAt" TIMESTAMP(3),
  "reminderSentAt" TIMESTAMP(3),
  "recurrenceType" "PersonalTodoRecurrenceType" NOT NULL DEFAULT 'NONE',
  "recurrenceInterval" INTEGER NOT NULL DEFAULT 1,
  "companyId" TEXT,
  "opportunityId" TEXT,
  "taskId" TEXT,
  "previousOccurrenceId" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "personal_todos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "personal_todos_id_organizationId_key" ON "personal_todos"("id", "organizationId");
CREATE UNIQUE INDEX "personal_todos_previousOccurrenceId_key" ON "personal_todos"("previousOccurrenceId");
CREATE INDEX "personal_todos_organizationId_userId_status_dueAt_idx" ON "personal_todos"("organizationId", "userId", "status", "dueAt");
CREATE INDEX "personal_todos_organizationId_userId_reminderAt_reminderSentAt_idx" ON "personal_todos"("organizationId", "userId", "reminderAt", "reminderSentAt");
CREATE INDEX "personal_todos_companyId_idx" ON "personal_todos"("companyId");
CREATE INDEX "personal_todos_opportunityId_idx" ON "personal_todos"("opportunityId");
CREATE INDEX "personal_todos_taskId_idx" ON "personal_todos"("taskId");

ALTER TABLE "personal_todos" ADD CONSTRAINT "personal_todos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_todos" ADD CONSTRAINT "personal_todos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_todos" ADD CONSTRAINT "personal_todos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "personal_todos" ADD CONSTRAINT "personal_todos_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "personal_todos" ADD CONSTRAINT "personal_todos_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "personal_todos" ADD CONSTRAINT "personal_todos_previousOccurrenceId_fkey" FOREIGN KEY ("previousOccurrenceId") REFERENCES "personal_todos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE POLICY "personal_todos_tenant_isolation" ON "personal_todos"
USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))
WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));
ALTER TABLE "personal_todos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "personal_todos" FORCE ROW LEVEL SECURITY;
