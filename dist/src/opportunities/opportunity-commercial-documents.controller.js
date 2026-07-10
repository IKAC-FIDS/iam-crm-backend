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
exports.OpportunityCommercialDocumentsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const change_commercial_document_status_dto_1 = require("./dto/change-commercial-document-status.dto");
const create_commercial_document_dto_1 = require("./dto/create-commercial-document.dto");
const find_commercial_documents_dto_1 = require("./dto/find-commercial-documents.dto");
const update_commercial_document_dto_1 = require("./dto/update-commercial-document.dto");
const opportunity_commercial_documents_service_1 = require("./opportunity-commercial-documents.service");
let OpportunityCommercialDocumentsController = class OpportunityCommercialDocumentsController {
    constructor(service) {
        this.service = service;
    }
    findAll(opportunityId, query, user) {
        return this.service.findAll(opportunityId, query, user);
    }
    create(opportunityId, dto, user) {
        return this.service.create(opportunityId, dto, user);
    }
    findOne(opportunityId, documentId, user) {
        return this.service.findOne(opportunityId, documentId, user);
    }
    update(opportunityId, documentId, dto, user) {
        return this.service.update(opportunityId, documentId, dto, user);
    }
    changeStatus(opportunityId, documentId, dto, user) {
        return this.service.changeStatus(opportunityId, documentId, dto, user);
    }
    remove(opportunityId, documentId, user) {
        return this.service.remove(opportunityId, documentId, user);
    }
};
exports.OpportunityCommercialDocumentsController = OpportunityCommercialDocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('commercial-document:view'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, find_commercial_documents_dto_1.FindCommercialDocumentsDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityCommercialDocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('commercial-document:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_commercial_document_dto_1.CreateCommercialDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityCommercialDocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':documentId'),
    (0, permissions_decorator_1.Permissions)('commercial-document:view'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityCommercialDocumentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':documentId'),
    (0, permissions_decorator_1.Permissions)('commercial-document:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_commercial_document_dto_1.UpdateCommercialDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityCommercialDocumentsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':documentId/status'),
    (0, permissions_decorator_1.Permissions)('commercial-document:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, change_commercial_document_status_dto_1.ChangeCommercialDocumentStatusDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityCommercialDocumentsController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Delete)(':documentId'),
    (0, permissions_decorator_1.Permissions)('commercial-document:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('documentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityCommercialDocumentsController.prototype, "remove", null);
exports.OpportunityCommercialDocumentsController = OpportunityCommercialDocumentsController = __decorate([
    (0, common_1.Controller)('opportunities/:opportunityId/commercial-documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [opportunity_commercial_documents_service_1.OpportunityCommercialDocumentsService])
], OpportunityCommercialDocumentsController);
//# sourceMappingURL=opportunity-commercial-documents.controller.js.map