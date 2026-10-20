"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantScope = void 0;
exports.getCurrentOrganizationId = getCurrentOrganizationId;
const tenant_context_util_1 = require("./tenant-context.util");
function contextFrom(authority) {
    const candidate = 'tenantRole' in authority ? authority : authority.tenantContext;
    (0, tenant_context_util_1.assertActiveTenantContext)(candidate);
    return candidate;
}
exports.tenantScope = {
    require(authority) {
        return contextFrom(authority);
    },
    organizationId(authority) {
        return contextFrom(authority).organizationId;
    },
    direct(authority, where) {
        return { AND: [where ?? {}, { organizationId: contextFrom(authority).organizationId }] };
    },
    throughCompany(authority, where) {
        return { AND: [where ?? {}, { company: { organizationId: contextFrom(authority).organizationId } }] };
    },
    activeMembership(authority) {
        return {
            organizationMemberships: {
                some: {
                    organizationId: contextFrom(authority).organizationId,
                    status: 'ACTIVE',
                },
            },
        };
    },
};
function getCurrentOrganizationId(user) {
    return exports.tenantScope.organizationId(user);
}
//# sourceMappingURL=tenant-scope.util.js.map