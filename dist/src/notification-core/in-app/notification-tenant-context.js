"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationTenantContext = notificationTenantContext;
function notificationTenantContext(organizationId, userId = 'notification-core') {
    return { tenantId: organizationId, organizationId, userId, membershipId: 'internal-notification-core', tenantRole: 'SYSTEM', permissions: [], platformAdmin: false, membershipStatus: 'active', resolutionSource: 'authenticated-membership' };
}
//# sourceMappingURL=notification-tenant-context.js.map