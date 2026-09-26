ALTER TABLE "people"
  ADD COLUMN "nationalCode" TEXT,
  ADD COLUMN "registrySource" TEXT;

CREATE UNIQUE INDEX "people_companyId_nationalCode_key"
  ON "people"("companyId", "nationalCode");

CREATE TABLE "company_registry_snapshots" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "nationalId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'LINKA',
  "normalizedData" JSONB NOT NULL,
  "rawData" JSONB NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_registry_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_registry_snapshots_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "company_registry_snapshots_organizationId_nationalId_provider_key"
  ON "company_registry_snapshots"("organizationId", "nationalId", "provider");
CREATE INDEX "company_registry_snapshots_organizationId_expiresAt_idx"
  ON "company_registry_snapshots"("organizationId", "expiresAt");
