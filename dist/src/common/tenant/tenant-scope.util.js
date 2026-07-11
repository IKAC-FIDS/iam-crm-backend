"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentOrganizationId = getCurrentOrganizationId;
const default_organization_constants_1 = require("./default-organization.constants");
function getCurrentOrganizationId(user) {
    return user.organizationId ?? default_organization_constants_1.DEFAULT_ORGANIZATION_ID;
}
//# sourceMappingURL=tenant-scope.util.js.map