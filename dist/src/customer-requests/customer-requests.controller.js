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
exports.InternalRequestsController = exports.PortalRequestsController = exports.PortalRequestTypesController = exports.InternalRequestTypesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const current_portal_principal_decorator_1 = require("../customer-access/current-portal-principal.decorator");
const portal_jwt_auth_guard_1 = require("../customer-access/portal-jwt-auth.guard");
const customer_requests_service_1 = require("./customer-requests.service");
const customer_request_operations_service_1 = require("./customer-request-operations.service");
const customer_request_dto_1 = require("./dto/customer-request.dto");
let InternalRequestTypesController = class InternalRequestTypesController {
    constructor(service) {
        this.service = service;
    }
    list(q, u) { return this.service.listTypesInternal(u, q.includeRetired); }
    create(d, u) { return this.service.createType(d, u); }
    update(id, d, u) { return this.service.updateType(id, d, u); }
    availability(id, d, u) { return this.service.configureAvailability(id, d, u); }
    formDraft(id, d, u) { return this.service.saveDraftForm(id, d.schema, u); }
    publish(id, u) { return this.service.publishForm(id, u); }
    versions(id, u) { return this.service.formHistory(id, u); }
};
exports.InternalRequestTypesController = InternalRequestTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('customer-request-type:view'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_request_dto_1.RequestTypeListDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('customer-request-type:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_request_dto_1.CreateRequestTypeDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('customer-request-type:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.UpdateRequestTypeDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/availability'),
    (0, permissions_decorator_1.Permissions)('customer-request-type:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.ConfigureAvailabilityDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "availability", null);
__decorate([
    (0, common_1.Post)(':id/form-draft'),
    (0, permissions_decorator_1.Permissions)('customer-request-type:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.FormSchemaDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "formDraft", null);
__decorate([
    (0, common_1.Post)(':id/form-publish'),
    (0, permissions_decorator_1.Permissions)('customer-request-type:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "publish", null);
__decorate([
    (0, common_1.Get)(':id/form-versions'),
    (0, permissions_decorator_1.Permissions)('customer-request-type:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestTypesController.prototype, "versions", null);
exports.InternalRequestTypesController = InternalRequestTypesController = __decorate([
    (0, common_1.Controller)('admin/customer-request-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [customer_requests_service_1.CustomerRequestsService])
], InternalRequestTypesController);
let PortalRequestTypesController = class PortalRequestTypesController {
    constructor(service) {
        this.service = service;
    }
    list(p) { return this.service.portalCatalog(p); }
    get(id, p) { return this.service.portalType(id, p); }
};
exports.PortalRequestTypesController = PortalRequestTypesController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalRequestTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestTypesController.prototype, "get", null);
exports.PortalRequestTypesController = PortalRequestTypesController = __decorate([
    (0, common_1.Controller)('portal/request-types'),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard),
    __metadata("design:paramtypes", [customer_requests_service_1.CustomerRequestsService])
], PortalRequestTypesController);
let PortalRequestsController = class PortalRequestsController {
    constructor(service) {
        this.service = service;
    }
    list(q, p) { return this.service.listPortal(q, p); }
    create(d, p) { return this.service.createPortalRequest(d, p); }
    detail(id, p) { return this.service.portalDetail(id, p); }
    draft(id, d, p) { return this.service.updateDraft(id, d, p); }
    submit(id, p) { return this.service.submit(id, p); }
    cancel(id, p) { return this.service.cancel(id, p); }
    history(id, p) { return this.service.portalHistory(id, p); }
    shares(id, p) { return this.service.listShares(id, p); }
    share(id, d, p) { return this.service.share(id, d.membershipId, p); }
    revoke(id, shareId, p) { return this.service.revokeShare(id, shareId, p); }
};
exports.PortalRequestsController = PortalRequestsController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_request_dto_1.PortalRequestListDto, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_request_dto_1.CreatePortalRequestDto, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/draft'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.UpdateDraftDto, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "draft", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)(':id/shares'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "shares", null);
__decorate([
    (0, common_1.Post)(':id/shares'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.ShareRequestDto, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "share", null);
__decorate([
    (0, common_1.Delete)(':id/shares/:shareId'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('shareId')),
    __param(2, (0, current_portal_principal_decorator_1.CurrentPortalPrincipal)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PortalRequestsController.prototype, "revoke", null);
exports.PortalRequestsController = PortalRequestsController = __decorate([
    (0, common_1.Controller)('portal/requests'),
    (0, common_1.UseGuards)(portal_jwt_auth_guard_1.PortalJwtAuthGuard),
    __metadata("design:paramtypes", [customer_requests_service_1.CustomerRequestsService])
], PortalRequestsController);
let InternalRequestsController = class InternalRequestsController {
    constructor(service, operations) {
        this.service = service;
        this.operations = operations;
    }
    list(q, u) { return this.service.listInternal(q, u); }
    triage(q, u) { return this.operations.list(q, u); }
    triageOptions(u) { return this.operations.options(u); }
    updateTriage(id, d, u) { return this.operations.updateTriage(id, d, u); }
    triageHistory(id, u) { return this.operations.history(id, u); }
    links(id, u) { return this.operations.links(id, u); }
    link(id, d, u) { return this.operations.linkExisting(id, d, u); }
    unlink(id, linkId, d, u) { return this.operations.unlink(id, linkId, d.reason, u); }
    createTask(id, d, u) { return this.operations.createTask(id, d, u); }
    createOpportunity(id, d, u) { return this.operations.createOpportunity(id, d, u); }
    createDocument(id, d, u) { return this.operations.createTechnicalDocument(id, d, u); }
    detail(id, u) { return this.service.internalDetail(id, u); }
    status(id, d, u) { return this.service.changeStatus(id, d, u); }
};
exports.InternalRequestsController = InternalRequestsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('customer-request:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_request_dto_1.RequestListDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('triage'),
    (0, permissions_decorator_1.Permissions)('customer-request:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_request_dto_1.RequestListDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "triage", null);
__decorate([
    (0, common_1.Get)('triage-options'),
    (0, permissions_decorator_1.Permissions)('customer-request:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "triageOptions", null);
__decorate([
    (0, common_1.Patch)(':id/triage'),
    (0, permissions_decorator_1.Permissions)('customer-request:triage'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.UpdateRequestTriageDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "updateTriage", null);
__decorate([
    (0, common_1.Get)(':id/triage-history'),
    (0, permissions_decorator_1.Permissions)('customer-request:view'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "triageHistory", null);
__decorate([
    (0, common_1.Get)(':id/crm-links'),
    (0, permissions_decorator_1.Permissions)('customer-request:view'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "links", null);
__decorate([
    (0, common_1.Post)(':id/crm-links'),
    (0, permissions_decorator_1.Permissions)('customer-request:link'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.LinkCustomerRequestRecordDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "link", null);
__decorate([
    (0, common_1.Delete)(':id/crm-links/:linkId'),
    (0, permissions_decorator_1.Permissions)('customer-request:link'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('linkId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, customer_request_dto_1.UnlinkCustomerRequestRecordDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "unlink", null);
__decorate([
    (0, common_1.Post)(':id/crm-links/tasks'),
    (0, permissions_decorator_1.Permissions)('customer-request:link'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.CreateLinkedTaskDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "createTask", null);
__decorate([
    (0, common_1.Post)(':id/crm-links/opportunities'),
    (0, permissions_decorator_1.Permissions)('customer-request:link'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.CreateLinkedOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "createOpportunity", null);
__decorate([
    (0, common_1.Post)(':id/crm-links/technical-documents'),
    (0, permissions_decorator_1.Permissions)('customer-request:link'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.CreateLinkedTechnicalDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "createDocument", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('customer-request:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('customer-request:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_request_dto_1.UpdateRequestStatusDto, Object]),
    __metadata("design:returntype", void 0)
], InternalRequestsController.prototype, "status", null);
exports.InternalRequestsController = InternalRequestsController = __decorate([
    (0, common_1.Controller)('customer-requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [customer_requests_service_1.CustomerRequestsService, customer_request_operations_service_1.CustomerRequestOperationsService])
], InternalRequestsController);
//# sourceMappingURL=customer-requests.controller.js.map