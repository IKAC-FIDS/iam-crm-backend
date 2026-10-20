"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPermissionsModule = void 0;
const common_1 = require("@nestjs/common");
const admin_permissions_service_1 = require("./admin-permissions.service");
const admin_permissions_controller_1 = require("./admin-permissions.controller");
const rbac_management_controller_1 = require("./rbac-management.controller");
const rbac_management_service_1 = require("./rbac-management.service");
const tenant_roles_service_1 = require("./tenant-roles.service");
const tenant_roles_controller_1 = require("./tenant-roles.controller");
let AdminPermissionsModule = class AdminPermissionsModule {
};
exports.AdminPermissionsModule = AdminPermissionsModule;
exports.AdminPermissionsModule = AdminPermissionsModule = __decorate([
    (0, common_1.Module)({
        providers: [admin_permissions_service_1.AdminPermissionsService, rbac_management_service_1.RbacManagementService, tenant_roles_service_1.TenantRolesService],
        controllers: [admin_permissions_controller_1.AdminPermissionsController, rbac_management_controller_1.PermissionsManagementController, rbac_management_controller_1.RolesManagementController, tenant_roles_controller_1.TenantRolesController],
        exports: [admin_permissions_service_1.AdminPermissionsService],
    })
], AdminPermissionsModule);
//# sourceMappingURL=admin-permissions.module.js.map