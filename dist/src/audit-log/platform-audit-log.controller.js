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
exports.PlatformAuditLogController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_platform_decorator_1 = require("../common/decorators/current-platform.decorator");
const platform_admin_guard_1 = require("../platform-authority/platform-admin.guard");
const audit_log_service_1 = require("./audit-log.service");
const find_audit_logs_dto_1 = require("./dto/find-audit-logs.dto");
let PlatformAuditLogController = class PlatformAuditLogController {
    constructor(service) {
        this.service = service;
    }
    findAll(query) {
        return this.service.findAllPlatform(query);
    }
    async export(query, platform, response) {
        const file = await this.service.exportPlatform(query, platform);
        response.setHeader("Content-Type", file.contentType);
        response.setHeader("Content-Disposition", file.contentDisposition);
        return new common_1.StreamableFile(file.buffer);
    }
    findOne(id) {
        return this.service.findOnePlatform(id);
    }
};
exports.PlatformAuditLogController = PlatformAuditLogController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_audit_logs_dto_1.FindAuditLogsDto]),
    __metadata("design:returntype", void 0)
], PlatformAuditLogController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("export"),
    (0, swagger_1.ApiProduces)("text/csv", "application/json", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_platform_decorator_1.CurrentPlatform)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_audit_logs_dto_1.FindAuditLogsDto, Object, Object]),
    __metadata("design:returntype", Promise)
], PlatformAuditLogController.prototype, "export", null);
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PlatformAuditLogController.prototype, "findOne", null);
exports.PlatformAuditLogController = PlatformAuditLogController = __decorate([
    (0, common_1.Controller)("admin/platform-audit-logs"),
    (0, common_1.UseGuards)(platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [audit_log_service_1.AuditLogService])
], PlatformAuditLogController);
//# sourceMappingURL=platform-audit-log.controller.js.map