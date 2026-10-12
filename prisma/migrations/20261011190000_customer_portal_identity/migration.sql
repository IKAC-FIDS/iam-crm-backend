CREATE TYPE "UserPrincipalType" AS ENUM ('INTERNAL', 'CUSTOMER');
CREATE TYPE "AuthSessionAudience" AS ENUM ('INTERNAL', 'PORTAL');
CREATE TYPE "CustomerRole" AS ENUM ('CUSTOMER_ADMIN', 'CUSTOMER_USER');
CREATE TYPE "CustomerMembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

ALTER TABLE "users"
  ADD COLUMN "normalizedEmail" TEXT,
  ADD COLUMN "principalType" "UserPrincipalType" NOT NULL DEFAULT 'INTERNAL';

UPDATE "users" SET "normalizedEmail" = lower(btrim("email"));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "users" GROUP BY "normalizedEmail" HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce normalized email uniqueness: duplicate user emails exist';
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "normalizedEmail" SET NOT NULL;
CREATE UNIQUE INDEX "users_normalizedEmail_key" ON "users"("normalizedEmail");

ALTER TABLE "refresh_sessions"
  ADD COLUMN "audience" "AuthSessionAudience" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "activeCustomerMembershipId" TEXT;
CREATE INDEX "refresh_sessions_userId_audience_revokedAt_expiresAt_idx"
  ON "refresh_sessions"("userId", "audience", "revokedAt", "expiresAt");
CREATE INDEX "refresh_sessions_activeCustomerMembershipId_idx"
  ON "refresh_sessions"("activeCustomerMembershipId");

ALTER TABLE "companies"
  ADD COLUMN "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "portalEnabledAt" TIMESTAMP(3),
  ADD COLUMN "portalEnabledById" TEXT;
CREATE INDEX "companies_organizationId_portalEnabled_archivedAt_idx"
  ON "companies"("organizationId", "portalEnabled", "archivedAt");
ALTER TABLE "companies" ADD CONSTRAINT "companies_portalEnabledById_fkey"
  FOREIGN KEY ("portalEnabledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "customer_company_memberships" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "CustomerRole" NOT NULL,
  "status" "CustomerMembershipStatus" NOT NULL DEFAULT 'INVITED',
  "invitedById" TEXT,
  "invitedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "lastAccessAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_company_memberships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "customer_membership_state_check" CHECK (
    ("status" <> 'ACTIVE' OR "activatedAt" IS NOT NULL)
    AND ("status" <> 'SUSPENDED' OR "suspendedAt" IS NOT NULL)
    AND ("status" <> 'REVOKED' OR "revokedAt" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "customer_company_memberships_companyId_userId_key"
  ON "customer_company_memberships"("companyId", "userId");
CREATE UNIQUE INDEX "customer_company_memberships_id_organizationId_key"
  ON "customer_company_memberships"("id", "organizationId");
CREATE INDEX "customer_company_memberships_organizationId_companyId_status_idx"
  ON "customer_company_memberships"("organizationId", "companyId", "status");
CREATE INDEX "customer_company_memberships_userId_status_idx"
  ON "customer_company_memberships"("userId", "status");
CREATE INDEX "customer_company_memberships_companyId_role_status_idx"
  ON "customer_company_memberships"("companyId", "role", "status");
ALTER TABLE "customer_company_memberships" ADD CONSTRAINT "customer_company_memberships_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_company_memberships" ADD CONSTRAINT "customer_company_memberships_companyId_organizationId_fkey"
  FOREIGN KEY ("companyId", "organizationId") REFERENCES "companies"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_company_memberships" ADD CONSTRAINT "customer_company_memberships_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_company_memberships" ADD CONSTRAINT "customer_company_memberships_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "customer_invitations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "normalizedEmail" TEXT NOT NULL,
  "role" "CustomerRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "acceptedById" TEXT,
  "revokedAt" TIMESTAMP(3),
  "replacedByInvitationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_invitations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "customer_invitations_tokenHash_key" ON "customer_invitations"("tokenHash");
CREATE INDEX "customer_invitations_organizationId_companyId_normalizedEmail_idx"
  ON "customer_invitations"("organizationId", "companyId", "normalizedEmail");
CREATE INDEX "customer_invitations_normalizedEmail_expiresAt_idx"
  ON "customer_invitations"("normalizedEmail", "expiresAt");
CREATE INDEX "customer_invitations_companyId_acceptedAt_revokedAt_expiresAt_idx"
  ON "customer_invitations"("companyId", "acceptedAt", "revokedAt", "expiresAt");
CREATE UNIQUE INDEX "customer_invitations_one_pending_per_company_email"
  ON "customer_invitations"("companyId", "normalizedEmail")
  WHERE "acceptedAt" IS NULL AND "revokedAt" IS NULL AND "replacedByInvitationId" IS NULL;
ALTER TABLE "customer_invitations" ADD CONSTRAINT "customer_invitations_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_invitations" ADD CONSTRAINT "customer_invitations_companyId_organizationId_fkey"
  FOREIGN KEY ("companyId", "organizationId") REFERENCES "companies"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_invitations" ADD CONSTRAINT "customer_invitations_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_invitations" ADD CONSTRAINT "customer_invitations_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "action", "name", "description", "group", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'company-customer-user:view', 'مشاهده کاربران پرتال شرکت', 'مشاهده فعال‌سازی، عضویت‌ها و دعوت‌های پرتال شرکت', 'شرکت‌ها', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'company-customer-user:manage', 'مدیریت کاربران پرتال شرکت', 'فعال‌سازی پرتال و مدیریت کاربران و دعوت‌های مشتری', 'شرکت‌ها', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role", "permissionId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ADMIN'::"UserRole", p."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "permissions" p
WHERE p."action" IN ('company-customer-user:view', 'company-customer-user:manage')
ON CONFLICT ("role", "permissionId") DO NOTHING;
