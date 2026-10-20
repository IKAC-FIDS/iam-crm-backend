"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertActiveTenantContext = assertActiveTenantContext;
const MEMBERSHIP_STATUSES = new Set([
    'invited',
    'active',
    'suspended',
]);
const RESOLUTION_SOURCES = new Set([
    'token-session',
    'explicit-selection',
    'authenticated-membership',
    'migration-compatibility',
]);
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requireIdentifier(value, key) {
    if (typeof value[key] !== 'string' || !value[key].trim()) {
        throw new Error(`TenantContext requires ${key}`);
    }
}
function assertActiveTenantContext(value) {
    if (!isRecord(value)) {
        throw new Error('TenantContext is required');
    }
    requireIdentifier(value, 'tenantId');
    requireIdentifier(value, 'organizationId');
    requireIdentifier(value, 'userId');
    requireIdentifier(value, 'membershipId');
    if (typeof value.membershipStatus !== 'string' ||
        !MEMBERSHIP_STATUSES.has(value.membershipStatus)) {
        throw new Error('TenantContext has an invalid membership status');
    }
    if (value.membershipStatus !== 'active') {
        throw new Error('TenantContext requires an active membership');
    }
    if (typeof value.resolutionSource !== 'string' ||
        !RESOLUTION_SOURCES.has(value.resolutionSource)) {
        throw new Error('TenantContext has an invalid resolution source');
    }
    if (typeof value.tenantRole !== 'string' || !value.tenantRole.trim()) {
        throw new Error('TenantContext requires tenantRole');
    }
    if (!Array.isArray(value.permissions) ||
        !value.permissions.every((permission) => typeof permission === 'string')) {
        throw new Error('TenantContext requires string permissions');
    }
    if (typeof value.platformAdmin !== 'boolean') {
        throw new Error('TenantContext requires explicit platformAdmin authority');
    }
}
//# sourceMappingURL=tenant-context.util.js.map