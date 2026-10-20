"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalCustomerUsersController = exports.InternalCustomerUsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const throttler_1 = require("@nestjs/throttler");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const current_portal_principal_decorator_1 = require("../customer-access/current-portal-principal.decorator");
const portal_jwt_auth_guard_1 = require("../customer-access/portal-jwt-auth.guard");
const portal_roles_decorator_1 = require("../customer-access/portal-roles.decorator");
const portal_roles_guard_1 = require("../customer-access/portal-roles.guard");
const customer_users_service_1 = require("./customer-users.service");
const customer_user_dto_1 = require("./dto/customer-user.dto");
let InternalCustomerUsersController = class InternalCustomerUsersController {
    constructor(service) {
        this.service = service;
    }
    overview(companyId, user) { return this.service.overview(companyId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user)); }
    enabled(companyId, dto, user) { return this.service.setPortalEnabled(companyId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user), dto.enabled, user.userId); }
    invite(companyId, dto, user) { return this.service.invite(companyId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user), dto.email, dto.role, user.userId); }
    resend(companyId, invitationId, user) { return this.service.resend(companyId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user), invitationId, user.userId); }
    revokeInvite(companyId, invitationId, user) { return this.service.revokeInvitation(companyId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user), invitationId, user.userId); }
    update(companyId, membershipId, dto, user) { return this.service.updateMembership(companyId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user), membershipId, dto, user.userId); }
};
exports.InternalCustomerUsersController = InternalCustomerUsersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('company-customer-user:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalCustomerUsersController.prototype, "overview", null);
__decorate([
    (0, common_1.Patch)(),
    (0, permissions_decorator_1.Permissions)('company-customer-user:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_user_dto_1.SetCompanyPortalEnabledDto, Object]),
    __metadata("design:returntype", void 0)
], InternalCustomerUsersController.prototype, "enabled", null);
__decorate([
    (0, common_1.Post)('invitations'),
    (0, permissions_decorator_1.Permissions)('company-customer-user:manage'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_user_dto_1.InviteCustomerDto, Object]),
    __metadata("design:returntype", void 0)
], InternalCustomerUsersController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('invitations/:invitationId/resend'),
    (0, permissions_decorator_1.Permissions)('company-customer-user:manage'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('invitationId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InternalCustomerUsersController.prototype, "resend", null);
__decorate([
    (0, common_1.Delete)('invitations/:invitationId'),
    (0, permissions_decorator_1.Permissions)('company-customer-user:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('invitationId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], InternalCustomerUsersController.prototype, "revokeInvite", null);
__decorate([
    (0, common_1.Patch)('memberships/:membershipId'),
    (0, permissions_decorator_1.Permissions)('company-customer-user:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('membershipId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, customer_user_dto_1.UpdateCustomerMembershipDto, Object]),
    __metadata("design:returntype", void 0)
], InternalCustomerUsersController.prototype, "update", null);
exports.InternalCustomerUsersController = InternalCustomerUsersController = __decorate([
    (0, common_1.Controller)('companies/:companyId/portal-access'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [customer_users_service_1.CustomerUsersService])
], InternalCustomerUsersController);
let PortalCustomerUsersController = class PortalCustomerUsersController {
    constructor(service) {
        this.service = service;
    }
    summary(p) { return this.service.portalCompanySummary(p.companyId, p.organizationId, p.role); }
    users(p) { return this.service.overview(p.companyId, p.organizationId); }
    invite(dto, p) { return this.service.invite(p.companyId, p.organizationId, dto.email, dto.role, p.userId); }
    resend(id, p) { return this.service.resend(p.companyId, p.organizationId, id, p.userId); }
    revoke(id, p) { return this.service.revokeInvitation(p.companyId, p.organizationId, id, p.userId); }
    update(id, dto, p) { return this.service.updateMembership(p.companyId, p.organizationId, id, dto, p.userId, true); }
};
exports.PortalCustomerUsersController = PortalCustomerUsersController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalCustomerUsersController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, portal_roles_decorator_1.PortalRoles)(client_1.CustomerRole.CUSTOMER_ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalCustomerUsersController.prototype, "users", null);
__decorate([
    (0, common_1.Post)('invitations'),
    (0, portal_roles_decorator_1.PortalRoles)(client_1.CustomerRole.CUSTOMER_ADMIN),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_user_dto_1.InviteCustomerDto, Object]),
    __metadata("design:returntype", void 0)
], PortalCustomerUsersController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)('invitations/:invitationId/resend'),
    (0, portal_roles_decorator_1.PortalRoles)(client_1.CustomerRole.CUSTOMER_ADMIN),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('invitationId')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalCustomerUsersController.prototype, "resend", null);
__decorate([
    (0, common_1.Delete)('invitations/:invitationId'),
    (0, portal_roles_decorator_1.PortalRoles)(client_1.CustomerRole.CUSTOMER_ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('invitationId')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalCustomerUsersController.prototype, "revoke", null);
__decorate([
    (0, common_1.Patch)('users/:membershipId'),
    (0, portal_roles_decorator_1.PortalRoles)(client_1.CustomerRole.CUSTOMER_ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('membershipId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_user_dto_1.UpdateCustomerMembershipDto, Object]),
    __metadata("design:returntype", void 0)
], PortalCustomerUsersController.prototype, "update", null);
exports.PortalCustomerUsersController = PortalCustomerUsersController = __decorate([
    (0, common_1.Controller)('portal/company'),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard, portal_roles_guard_1.PortalRolesGuard),
    __metadata("design:paramtypes", [customer_users_service_1.CustomerUsersService])
], PortalCustomerUsersController);
//# sourceMappingURL=customer-users.controller.js.map