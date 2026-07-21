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
exports.AuditLogController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const audit_log_service_1 = require("./audit-log.service");
const find_audit_logs_dto_1 = require("./dto/find-audit-logs.dto");
let AuditLogController = class AuditLogController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) {
        return this.service.findAll(query, user);
    }
    summary(query, user) {
        return this.service.summary(query, user);
    }
    filterOptions(query, user) {
        return this.service.filterOptions(query, user);
    }
    async export(query, user, response) {
        const file = await this.service.export(query, user);
        response.setHeader("Content-Type", file.contentType);
        response.setHeader("Content-Disposition", file.contentDisposition);
        return new common_1.StreamableFile(file.buffer);
    }
    findOne(id, user) {
        return this.service.findOne(id, user);
    }
};
exports.AuditLogController = AuditLogController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_audit_logs_dto_1.FindAuditLogsDto, Object]),
    __metadata("design:returntype", void 0)
], AuditLogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_audit_logs_dto_1.FindAuditLogsDto, Object]),
    __metadata("design:returntype", void 0)
], AuditLogController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)("filter-options"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_audit_logs_dto_1.FindAuditLogsDto, Object]),
    __metadata("design:returntype", void 0)
], AuditLogController.prototype, "filterOptions", null);
__decorate([
    (0, common_1.Get)("export"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_audit_logs_dto_1.FindAuditLogsDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuditLogController.prototype, "export", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuditLogController.prototype, "findOne", null);
exports.AuditLogController = AuditLogController = __decorate([
    (0, common_1.Controller)("admin/audit-logs"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("audit-log:view"),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], AuditLogController);
//# sourceMappingURL=audit-log.controller.js.map