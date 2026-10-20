"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantOnboardingPreflight = tenantOnboardingPreflight;
exports.tenantOnboardingValidate = tenantOnboardingValidate;
const client_1 = require("@prisma/client");
async function columnExists(prisma, table, column) {
    const rows = await prisma.$queryRaw(client_1.Prisma.sql `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
    ) AS "exists"
  `);
    return rows[0]?.exists === true;
}
async function tenantOnboardingPreflight(prisma) {
    const schemaReady = await columnExists(prisma, 'organizations', 'onboardingStatus');
    const ownerReady = await columnExists(prisma, 'organization_memberships', 'isTenantOwner');
    const [organizations, memberships, teams, platformAuthorities] = await Promise.all([
        prisma.organization.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.organizationMembership.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.team.groupBy({ by: ['organizationId'], _count: { _all: true } }),
        prisma.platformAuthority.count(),
    ]);
    const owners = ownerReady
        ? await prisma.organizationMembership.groupBy({
            by: ['organizationId'],
            where: { isTenantOwner: true, status: client_1.OrganizationMembershipStatus.ACTIVE },
            _count: { _all: true },
        })
        : [];
    return {
        status: 'ready',
        schemaReady,
        ownerReady,
        organizations,
        memberships,
        teams,
        activeOwnerReport: owners,
        platformAuthorities,
        backfill: 'report-only; no Tenant Owner is inferred automatically',
    };
}
async function tenantOnboardingValidate(prisma) {
    const [invalidActive, invalidOwner, archivedOperational] = await Promise.all([
        prisma.organization.count({
            where: {
                status: client_1.OrganizationStatus.ACTIVE,
                onboardingStatus: { in: [client_1.OrganizationOnboardingStatus.IN_PROGRESS, client_1.OrganizationOnboardingStatus.FAILED] },
            },
        }),
        prisma.organizationMembership.count({
            where: { isTenantOwner: true, OR: [{ status: { not: client_1.OrganizationMembershipStatus.ACTIVE } }, { user: { isActive: false } }] },
        }),
        prisma.organization.count({ where: { status: client_1.OrganizationStatus.ARCHIVED, onboardingStatus: client_1.OrganizationOnboardingStatus.IN_PROGRESS } }),
    ]);
    return {
        status: invalidActive === 0 && invalidOwner === 0 && archivedOperational === 0 ? 'passed' : 'failed',
        invalidActiveOnboarding: invalidActive,
        invalidTenantOwners: invalidOwner,
        archivedInProgress: archivedOperational,
    };
}
async function main() {
    const command = process.argv[2];
    const prisma = new client_1.PrismaClient();
    try {
        const result = command === 'preflight'
            ? await tenantOnboardingPreflight(prisma)
            : command === 'validate'
                ? await tenantOnboardingValidate(prisma)
                : (() => { throw new Error('Expected preflight or validate'); })();
        console.log(JSON.stringify(result, null, 2));
        if (result.status === 'failed')
            process.exitCode = 1;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : 'Tenant onboarding maintenance failed');
        process.exitCode = 1;
    });
}
//# sourceMappingURL=tenant-onboarding-maintenance.js.map