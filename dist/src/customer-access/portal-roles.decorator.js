"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalRoles = exports.PORTAL_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PORTAL_ROLES_KEY = 'portal-roles';
const PortalRoles = (...roles) => (0, common_1.SetMetadata)(exports.PORTAL_ROLES_KEY, roles);
exports.PortalRoles = PortalRoles;
//# sourceMappingURL=portal-roles.decorator.js.map