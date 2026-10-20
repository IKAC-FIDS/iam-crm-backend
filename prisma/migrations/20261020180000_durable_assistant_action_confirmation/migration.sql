-- Durable, tenant-scoped idempotency ledger for confirmed CRM assistant actions.
CREATE TYPE "AssistantActionExecutionStatus" AS ENUM (
  'EXECUTING',
  'SUCCEEDED',
  'REQUIRES_RECONCILIATION'
);

CREATE TABLE "assistant_action_executions" (
  "id" TEXT NOT NULL,
  "nonce" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "membershipId" TEXT,
  "actionType" TEXT NOT NULL,
  "status" "AssistantActionExecutionStatus" NOT NULL DEFAULT 'EXECUTING',
  "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
  "responsePayload" JSONB,
  "errorCode" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "assistant_action_executions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assistant_action_executions_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "assistant_action_executions_userId_fkey"
    FOREIGN KEY ("userId", "organizationId") REFERENCES "users"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "assistant_action_executions_membershipId_fkey"
    FOREIGN KEY ("membershipId", "organizationId", "userId") REFERENCES "organization_memberships"("id", "organizationId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "assistant_action_executions_nonce_key"
  ON "assistant_action_executions"("nonce");
CREATE INDEX "assistant_action_executions_organizationId_userId_createdAt_idx"
  ON "assistant_action_executions"("organizationId", "userId", "createdAt");
CREATE INDEX "assistant_action_executions_organizationId_status_updatedAt_idx"
  ON "assistant_action_executions"("organizationId", "status", "updatedAt");

ALTER TABLE "assistant_action_executions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assistant_action_executions_tenant_isolation"
  ON "assistant_action_executions"
  USING (
    "organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')
  )
  WITH CHECK (
    "organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')
  );
