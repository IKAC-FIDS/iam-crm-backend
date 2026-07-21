"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModule = void 0;
const common_1 = require("@nestjs/common");
const http_request_logging_middleware_1 = require("../common/logging/http-request-logging.middleware");
const audit_log_controller_1 = require("./audit-log.controller");
const audit_request_context_middleware_1 = require("./audit-request-context.middleware");
const audit_request_context_service_1 = require("./audit-request-context.service");
const audit_log_service_1 = require("./audit-log.service");
const report_export_service_1 = require("../common/export/report-export.service");
let AuditLogModule = class AuditLogModule {
    configure(consumer) {
        consumer
            .apply(audit_request_context_middleware_1.AuditRequestContextMiddleware, http_request_logging_middleware_1.HttpRequestLoggingMiddleware)
            .forRoutes("*");
    }
};
exports.AuditLogModule = AuditLogModule;
exports.AuditLogModule = AuditLogModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [audit_log_controller_1.AuditLogController],
        providers: [
            audit_log_service_1.AuditLogService,
            audit_request_context_service_1.AuditRequestContextService,
            audit_request_context_middleware_1.AuditRequestContextMiddleware,
            http_request_logging_middleware_1.HttpRequestLoggingMiddleware,
            report_export_service_1.ReportExportService,
        ],
        exports: [audit_log_service_1.AuditLogService, audit_request_context_service_1.AuditRequestContextService, report_export_service_1.ReportExportService],
    })
], AuditLogModule);
//# sourceMappingURL=audit-log.module.js.map