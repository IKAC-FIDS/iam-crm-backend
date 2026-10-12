CREATE TYPE "CustomerRequestAvailabilityPolicy" AS ENUM ('ALL_PORTAL_COMPANIES', 'SELECTED_COMPANIES');
CREATE TYPE "CustomerRequestFormVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "CustomerRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED', 'CANCELLED');
CREATE TYPE "CustomerRequestActorType" AS ENUM ('CUSTOMER', 'INTERNAL', 'SYSTEM');

CREATE TABLE "customer_request_types" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "code" TEXT NOT NULL,
  "displayName" TEXT NOT NULL, "description" TEXT, "presentation" JSONB,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "availabilityPolicy" "CustomerRequestAvailabilityPolicy" NOT NULL DEFAULT 'ALL_PORTAL_COMPANIES',
  "isEnabled" BOOLEAN NOT NULL DEFAULT true, "retiredAt" TIMESTAMP(3),
  "currentPublishedVersionId" TEXT, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_request_types_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "customer_request_form_versions" (
  "id" TEXT NOT NULL, "requestTypeId" TEXT NOT NULL, "version" INTEGER NOT NULL,
  "status" "CustomerRequestFormVersionStatus" NOT NULL DEFAULT 'DRAFT', "schema" JSONB NOT NULL,
  "publishedAt" TIMESTAMP(3), "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_request_form_versions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "customer_request_type_company_availability" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "requestTypeId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_request_type_company_availability_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "customer_requests" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "requestTypeId" TEXT NOT NULL, "formVersionId" TEXT NOT NULL,
  "creatorUserId" TEXT NOT NULL, "creatorMembershipId" TEXT NOT NULL,
  "trackingNumber" TEXT, "title" TEXT NOT NULL,
  "status" "CustomerRequestStatus" NOT NULL DEFAULT 'DRAFT', "answers" JSONB NOT NULL,
  "submittedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "customer_request_status_history" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL, "previousStatus" "CustomerRequestStatus", "newStatus" "CustomerRequestStatus" NOT NULL,
  "actorType" "CustomerRequestActorType" NOT NULL, "actorId" TEXT,
  "customerVisibleExplanation" TEXT, "internalReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_request_status_history_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "customer_request_shares" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "companyId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL, "membershipId" TEXT NOT NULL, "sharedByUserId" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3), "revokedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_request_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_request_types_organizationId_code_key" ON "customer_request_types"("organizationId", "code");
CREATE UNIQUE INDEX "customer_request_types_id_organizationId_key" ON "customer_request_types"("id", "organizationId");
CREATE UNIQUE INDEX "customer_request_types_currentPublishedVersionId_key" ON "customer_request_types"("currentPublishedVersionId");
CREATE INDEX "customer_request_types_organizationId_isEnabled_retiredAt_displayOrder_idx" ON "customer_request_types"("organizationId", "isEnabled", "retiredAt", "displayOrder");
CREATE UNIQUE INDEX "customer_request_form_versions_requestTypeId_version_key" ON "customer_request_form_versions"("requestTypeId", "version");
CREATE INDEX "customer_request_form_versions_requestTypeId_status_version_idx" ON "customer_request_form_versions"("requestTypeId", "status", "version");
CREATE UNIQUE INDEX "customer_request_type_company_availability_requestTypeId_companyId_key" ON "customer_request_type_company_availability"("requestTypeId", "companyId");
CREATE INDEX "customer_request_type_company_availability_organizationId_companyId_idx" ON "customer_request_type_company_availability"("organizationId", "companyId");
CREATE UNIQUE INDEX "customer_requests_trackingNumber_key" ON "customer_requests"("trackingNumber");
CREATE UNIQUE INDEX "customer_requests_id_organizationId_companyId_key" ON "customer_requests"("id", "organizationId", "companyId");
CREATE INDEX "customer_requests_organizationId_companyId_status_updatedAt_idx" ON "customer_requests"("organizationId", "companyId", "status", "updatedAt");
CREATE INDEX "customer_requests_organizationId_requestTypeId_submittedAt_idx" ON "customer_requests"("organizationId", "requestTypeId", "submittedAt");
CREATE INDEX "customer_requests_creatorMembershipId_status_idx" ON "customer_requests"("creatorMembershipId", "status");
CREATE INDEX "customer_request_status_history_requestId_createdAt_idx" ON "customer_request_status_history"("requestId", "createdAt");
CREATE INDEX "customer_request_status_history_organizationId_companyId_createdAt_idx" ON "customer_request_status_history"("organizationId", "companyId", "createdAt");
CREATE UNIQUE INDEX "customer_request_shares_requestId_membershipId_key" ON "customer_request_shares"("requestId", "membershipId");
CREATE UNIQUE INDEX "customer_company_memberships_id_organizationId_companyId_key" ON "customer_company_memberships"("id", "organizationId", "companyId");
CREATE INDEX "customer_request_shares_organizationId_companyId_membershipId_revokedAt_idx" ON "customer_request_shares"("organizationId", "companyId", "membershipId", "revokedAt");

ALTER TABLE "customer_request_types" ADD CONSTRAINT "customer_request_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_request_types" ADD CONSTRAINT "customer_request_types_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_request_form_versions" ADD CONSTRAINT "customer_request_form_versions_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "customer_request_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_request_form_versions" ADD CONSTRAINT "customer_request_form_versions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_request_types" ADD CONSTRAINT "customer_request_types_currentPublishedVersionId_fkey" FOREIGN KEY ("currentPublishedVersionId") REFERENCES "customer_request_form_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_request_type_company_availability" ADD CONSTRAINT "request_type_availability_type_tenant_fkey" FOREIGN KEY ("requestTypeId", "organizationId") REFERENCES "customer_request_types"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_request_type_company_availability" ADD CONSTRAINT "request_type_availability_company_tenant_fkey" FOREIGN KEY ("companyId", "organizationId") REFERENCES "companies"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_company_tenant_fkey" FOREIGN KEY ("companyId", "organizationId") REFERENCES "companies"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_type_tenant_fkey" FOREIGN KEY ("requestTypeId", "organizationId") REFERENCES "customer_request_types"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "customer_request_form_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_requests" ADD CONSTRAINT "customer_requests_creatorMembership_tenant_fkey" FOREIGN KEY ("creatorMembershipId", "organizationId") REFERENCES "customer_company_memberships"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_request_status_history" ADD CONSTRAINT "customer_request_status_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_request_status_history" ADD CONSTRAINT "customer_request_status_history_request_tenant_company_fkey" FOREIGN KEY ("requestId", "organizationId", "companyId") REFERENCES "customer_requests"("id", "organizationId", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_request_status_history" ADD CONSTRAINT "customer_request_status_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "customer_request_shares" ADD CONSTRAINT "customer_request_shares_request_tenant_company_fkey" FOREIGN KEY ("requestId", "organizationId", "companyId") REFERENCES "customer_requests"("id", "organizationId", "companyId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_request_shares" ADD CONSTRAINT "customer_request_shares_membership_tenant_company_fkey" FOREIGN KEY ("membershipId", "organizationId", "companyId") REFERENCES "customer_company_memberships"("id", "organizationId", "companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "permissions" ("id", "action", "name", "description", "group", "isSystem", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'customer-request-type:view', 'مشاهده انواع درخواست مشتری', 'مشاهده تنظیمات و نسخه‌های فرم درخواست مشتری', 'خدمات مشتریان', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'customer-request-type:manage', 'مدیریت انواع درخواست مشتری', 'مدیریت انواع، دسترسی شرکت‌ها و فرم‌های درخواست مشتری', 'خدمات مشتریان', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'customer-request:view', 'مشاهده درخواست‌های مشتری', 'مشاهده صندوق درخواست‌های خدمات مشتری', 'خدمات مشتریان', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'customer-request:manage', 'مدیریت درخواست‌های مشتری', 'تغییر وضعیت درخواست‌های خدمات مشتری', 'خدمات مشتریان', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("action") DO NOTHING;
INSERT INTO "role_permissions" ("id", "role", "permissionId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ADMIN'::"UserRole", p."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "permissions" p
WHERE p."action" IN ('customer-request-type:view', 'customer-request-type:manage', 'customer-request:view', 'customer-request:manage')
ON CONFLICT ("role", "permissionId") DO NOTHING;
