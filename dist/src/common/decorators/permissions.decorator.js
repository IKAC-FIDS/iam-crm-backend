"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyPermission = exports.Permissions = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
const Permissions = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, {
    actions: permissions,
    mode: 'all',
});
exports.Permissions = Permissions;
const AnyPermission = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, {
    actions: permissions,
    mode: 'any',
});
exports.AnyPermission = AnyPermission;
//# sourceMappingURL=permissions.decorator.js.map