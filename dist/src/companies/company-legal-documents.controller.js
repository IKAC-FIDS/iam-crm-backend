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
exports.CompanyLegalDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const company_legal_documents_service_1 = require("./company-legal-documents.service");
const company_legal_document_dto_1 = require("./dto/company-legal-document.dto");
const http_log_context_1 = require("../common/logging/http-log-context");
let CompanyLegalDocumentsController = class CompanyLegalDocumentsController {
    constructor(service) {
        this.service = service;
    }
    findAll(companyId, user) {
        return this.service.findAll(companyId, user);
    }
    upload(companyId, dto, file, user, req) {
        return this.service.upload(companyId, dto, file, user, (0, http_log_context_1.getRequestId)(req));
    }
    update(companyId, documentId, dto, user) {
        return this.service.update(companyId, documentId, dto, user);
    }
    remove(companyId, documentId, user) {
        return this.service.remove(companyId, documentId, user);
    }
};
exports.CompanyLegalDocumentsController = CompanyLegalDocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('company:view'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompanyLegalDocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, permissions_decorator_1.Permissions)('company:update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 25 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, company_legal_document_dto_1.UploadCompanyLegalDocumentDto, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], CompanyLegalDocumentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Patch)(':documentId'),
    (0, permissions_decorator_1.Permissions)('company:update'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, company_legal_document_dto_1.UpdateCompanyLegalDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], CompanyLegalDocumentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':documentId'),
    (0, permissions_decorator_1.Permissions)('company:update'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CompanyLegalDocumentsController.prototype, "remove", null);
exports.CompanyLegalDocumentsController = CompanyLegalDocumentsController = __decorate([
    (0, common_1.Controller)('companies/:companyId/legal-documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [company_legal_documents_service_1.CompanyLegalDocumentsService])
], CompanyLegalDocumentsController);
//# sourceMappingURL=company-legal-documents.controller.js.map