"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationMembershipsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const organization_memberships_service_1 = require("./organization-memberships.service");
const tenant_resolver_service_1 = require("./tenant-resolver.service");
const tenant_rbac_service_1 = require("./tenant-rbac.service");
const tenant_rbac_controller_1 = require("./tenant-rbac.controller");
let OrganizationMembershipsModule = class OrganizationMembershipsModule {
};
exports.OrganizationMembershipsModule = OrganizationMembershipsModule;
exports.OrganizationMembershipsModule = OrganizationMembershipsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [organization_memberships_service_1.OrganizationMembershipsService, tenant_resolver_service_1.TenantResolverService, tenant_rbac_service_1.TenantRbacService],
        controllers: [tenant_rbac_controller_1.TenantRolesController, tenant_rbac_controller_1.TenantMembershipRolesController],
        exports: [organization_memberships_service_1.OrganizationMembershipsService, tenant_resolver_service_1.TenantResolverService, tenant_rbac_service_1.TenantRbacService],
    })
], OrganizationMembershipsModule);
//# sourceMappingURL=organization-memberships.module.js.map