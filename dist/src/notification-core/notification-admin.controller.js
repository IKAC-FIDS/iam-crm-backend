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
exports.NotificationDeliveriesController = exports.NotificationTemplatesController = exports.NotificationAdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const notification_admin_dto_1 = require("./dto/notification-admin.dto");
const notification_admin_service_1 = require("./notification-admin.service");
const notification_delivery_dispatcher_service_1 = require("./notification-delivery-dispatcher.service");
let NotificationAdminController = class NotificationAdminController {
    constructor(admin) {
        this.admin = admin;
    }
    catalog() { return this.admin.catalog(); }
    templates(query, user) { return this.admin.listTemplates(query, user); }
    variables(eventName) { return this.admin.templateVariables(eventName); }
    preview(dto) { return this.admin.previewTemplate(dto); }
    activate(id, user) { return this.admin.activateTemplate(id, user); }
    template(id, user) { return this.admin.getTemplate(id, user); }
    createTemplate(dto, user) { return this.admin.createTemplate(dto, user); }
    updateTemplate(id, dto, user) { return this.admin.updateTemplate(id, dto, user); }
    removeTemplate(id, user) { return this.admin.removeTemplate(id, user); }
    deliveries(query, user) { return this.admin.listDeliveries(query, user); }
    delivery(id, user) { return this.admin.getDelivery(id, user); }
    channels(user) { return this.admin.channelStatus(user); }
};
exports.NotificationAdminController = NotificationAdminController;
__decorate([
    (0, common_1.Get)("catalog"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)("templates"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.NotificationTemplateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "templates", null);
__decorate([
    (0, common_1.Get)("templates/variables"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("eventName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "variables", null);
__decorate([
    (0, common_1.Post)("templates/preview"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.PreviewNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)("templates/:id/activate"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "activate", null);
__decorate([
    (0, common_1.Get)("templates/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "template", null);
__decorate([
    (0, common_1.Post)("templates"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.CreateNotificationTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)("templates/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_admin_dto_1.UpdateNotificationTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)("templates/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "removeTemplate", null);
__decorate([
    (0, common_1.Get)("deliveries"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.NotificationDeliveryQueryDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "deliveries", null);
__decorate([
    (0, common_1.Get)("deliveries/:id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "delivery", null);
__decorate([
    (0, common_1.Get)("channels/status"),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationAdminController.prototype, "channels", null);
exports.NotificationAdminController = NotificationAdminController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notifications"),
    __metadata("design:paramtypes", [notification_admin_service_1.NotificationAdminService])
], NotificationAdminController);
let NotificationTemplatesController = class NotificationTemplatesController {
    constructor(admin) {
        this.admin = admin;
    }
    list(query, user) { return this.admin.listTemplates(query, user); }
    variables(eventName) { return this.admin.templateVariables(eventName); }
    preview(dto) { return this.admin.previewTemplate(dto); }
    activate(id, user) { return this.admin.activateTemplate(id, user); }
    get(id, user) { return this.admin.getTemplate(id, user); }
    create(dto, user) { return this.admin.createTemplate(dto, user); }
    update(id, dto, user) { return this.admin.updateTemplate(id, dto, user); }
    remove(id, user) { return this.admin.removeTemplate(id, user); }
};
exports.NotificationTemplatesController = NotificationTemplatesController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.NotificationTemplateQueryDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("variables"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("eventName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "variables", null);
__decorate([
    (0, common_1.Post)("preview"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.PreviewNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)(":id/activate"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "activate", null);
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.CreateNotificationTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_admin_dto_1.UpdateNotificationTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationTemplatesController.prototype, "remove", null);
exports.NotificationTemplatesController = NotificationTemplatesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notification-templates"),
    __metadata("design:paramtypes", [notification_admin_service_1.NotificationAdminService])
], NotificationTemplatesController);
let NotificationDeliveriesController = class NotificationDeliveriesController {
    constructor(admin, dispatcher) {
        this.admin = admin;
        this.dispatcher = dispatcher;
    }
    list(query, user) { return this.admin.listDeliveries(query, user); }
    get(id, user) { return this.admin.getDelivery(id, user); }
    dispatch(id, user) { return this.dispatcher.dispatch(id, tenant_scope_util_1.tenantScope.require(user).organizationId); }
};
exports.NotificationDeliveriesController = NotificationDeliveriesController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_admin_dto_1.NotificationDeliveryQueryDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationDeliveriesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationDeliveriesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(":id/dispatch"),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationDeliveriesController.prototype, "dispatch", null);
exports.NotificationDeliveriesController = NotificationDeliveriesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notification-deliveries"),
    __metadata("design:paramtypes", [notification_admin_service_1.NotificationAdminService, notification_delivery_dispatcher_service_1.NotificationDeliveryDispatcher])
], NotificationDeliveriesController);
//# sourceMappingURL=notification-admin.controller.js.map