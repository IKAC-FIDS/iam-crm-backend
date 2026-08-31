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
exports.TechnicalTendersController = exports.TechnicalResourcesController = exports.TechnicalDocumentsController = exports.TechnicalKnowledgeController = exports.TechnicalReleasesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const technical_center_dto_1 = require("./dto/technical-center.dto");
const technical_center_service_1 = require("./technical-center.service");
let TechnicalReleasesController = class TechnicalReleasesController {
    constructor(service) {
        this.service = service;
    }
    list(q, u) { return this.service.listReleases(q, u); }
    create(d, u) { return this.service.createRelease(d, u); }
    get(id, u) { return this.service.getRelease(id, u); }
    update(id, d, u) { return this.service.updateRelease(id, d, u); }
    transition(id, d, u) { return this.service.transitionRelease(id, d, u); }
};
exports.TechnicalReleasesController = TechnicalReleasesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('technical-release:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.TechnicalListDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalReleasesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('technical-release:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.CreateReleaseDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalReleasesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-release:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalReleasesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-release:manage'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.UpdateReleaseDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalReleasesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/transition'),
    (0, permissions_decorator_1.AnyPermission)('technical-release:manage', 'technical-release:publish'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.ReleaseTransitionDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalReleasesController.prototype, "transition", null);
exports.TechnicalReleasesController = TechnicalReleasesController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiTags)('Technical releases'),
    (0, common_1.Controller)('technical/releases'),
    __metadata("design:paramtypes", [technical_center_service_1.TechnicalCenterService])
], TechnicalReleasesController);
let TechnicalKnowledgeController = class TechnicalKnowledgeController {
    constructor(service) {
        this.service = service;
    }
    list(q, u) { return this.service.listKnowledge(q, u); }
    create(d, u) { return this.service.createKnowledge(d, u); }
    get(id, u) { return this.service.getKnowledge(id, u); }
    update(id, d, u) { return this.service.updateKnowledge(id, d, u); }
    transition(id, d, u) { return this.service.transitionKnowledge(id, d, u); }
};
exports.TechnicalKnowledgeController = TechnicalKnowledgeController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('technical-knowledge:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.TechnicalListDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalKnowledgeController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('technical-knowledge:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.CreateKnowledgeDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalKnowledgeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-knowledge:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalKnowledgeController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-knowledge:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.UpdateKnowledgeDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalKnowledgeController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/transition'),
    (0, permissions_decorator_1.AnyPermission)('technical-knowledge:manage', 'technical-knowledge:publish'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.KnowledgeTransitionDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalKnowledgeController.prototype, "transition", null);
exports.TechnicalKnowledgeController = TechnicalKnowledgeController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiTags)('Technical knowledge'),
    (0, common_1.Controller)('technical/knowledge-base'),
    __metadata("design:paramtypes", [technical_center_service_1.TechnicalCenterService])
], TechnicalKnowledgeController);
let TechnicalDocumentsController = class TechnicalDocumentsController {
    constructor(service) {
        this.service = service;
    }
    list(q, u) { return this.service.listDocuments(q, u); }
    create(d, u) { return this.service.createDocument(d, u); }
    get(id, u) { return this.service.getDocument(id, u); }
    update(id, d, u) { return this.service.updateDocument(id, d, u); }
    transition(id, d, u) { return this.service.transitionDocument(id, d, u); }
    versions(id, u) { return this.service.listDocumentVersions(id, u); }
    version(id, d, u) { return this.service.addDocumentVersion(id, d, u); }
    getVersion(id, versionId, u) { return this.service.getDocumentVersion(id, versionId, u); }
};
exports.TechnicalDocumentsController = TechnicalDocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('technical-document:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.TechnicalDocumentListDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('technical-document:manage'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.CreateDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-document:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-document:manage'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.UpdateDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/transition'),
    (0, permissions_decorator_1.AnyPermission)('technical-document:manage', 'technical-document:approve'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.DocumentTransitionDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "transition", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, permissions_decorator_1.Permissions)('technical-document:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "versions", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    (0, permissions_decorator_1.Permissions)('technical-document:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.CreateDocumentVersionDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "version", null);
__decorate([
    (0, common_1.Get)(':id/versions/:versionId'),
    (0, permissions_decorator_1.Permissions)('technical-document:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('versionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalDocumentsController.prototype, "getVersion", null);
exports.TechnicalDocumentsController = TechnicalDocumentsController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiTags)('Technical documents'),
    (0, common_1.Controller)('technical/documents'),
    __metadata("design:paramtypes", [technical_center_service_1.TechnicalCenterService])
], TechnicalDocumentsController);
let TechnicalResourcesController = class TechnicalResourcesController {
    constructor(service) {
        this.service = service;
    }
    list(q, u) { return this.service.listResources(q, u); }
    create(d, u) { return this.service.createResource(d, u); }
    get(id, u) { return this.service.getResource(id, u); }
    update(id, d, u) { return this.service.updateResource(id, d, u); }
};
exports.TechnicalResourcesController = TechnicalResourcesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('technical-resource:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.TechnicalListDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalResourcesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('technical-resource:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.CreateResourceDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalResourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-resource:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalResourcesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-resource:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.UpdateResourceDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalResourcesController.prototype, "update", null);
exports.TechnicalResourcesController = TechnicalResourcesController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiTags)('Technical resources'),
    (0, common_1.Controller)('technical/resources'),
    __metadata("design:paramtypes", [technical_center_service_1.TechnicalCenterService])
], TechnicalResourcesController);
let TechnicalTendersController = class TechnicalTendersController {
    constructor(service) {
        this.service = service;
    }
    list(q, u) { return this.service.listTenders(q, u); }
    create(d, u) { return this.service.createTender(d, u); }
    get(id, u) { return this.service.getTender(id, u); }
    update(id, d, u) { return this.service.updateTender(id, d, u); }
    transition(id, d, u) { return this.service.transitionTender(id, d, u); }
    readiness(id, u) { return this.service.getTenderReadiness(id, u); }
    history(id, u) { return this.service.tenderHistory(id, u); }
    reviews(id, u) { return this.service.listTenderReviews(id, u); }
    requestReview(id, d, u) { return this.service.requestTenderReview(id, d, u); }
    decideReview(id, reviewId, d, u) { return this.service.decideTenderReview(id, reviewId, d, u); }
    requirements(id, u) { return this.service.listRequirements(id, u); }
    addRequirement(id, d, u) { return this.service.addRequirement(id, d, u); }
    updateRequirement(id, requirementId, d, u) { return this.service.updateRequirement(id, requirementId, d, u); }
    removeRequirement(id, requirementId, u) { return this.service.removeRequirement(id, requirementId, u); }
    addDeliverable(id, d, u) { return this.service.addDeliverable(id, d, u); }
    removeDeliverable(id, deliverableId, u) { return this.service.removeDeliverable(id, deliverableId, u); }
};
exports.TechnicalTendersController = TechnicalTendersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('technical-tender:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.TechnicalListDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technical_center_dto_1.CreateTenderDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-tender:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.UpdateTenderDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/transition'),
    (0, permissions_decorator_1.AnyPermission)('technical-tender:manage', 'technical-tender:submit', 'technical-tender:close'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.TenderTransitionDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "transition", null);
__decorate([
    (0, common_1.Get)(':id/readiness'),
    (0, permissions_decorator_1.Permissions)('technical-tender:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "readiness", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, permissions_decorator_1.Permissions)('technical-tender:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "history", null);
__decorate([
    (0, common_1.Get)(':id/reviews'),
    (0, permissions_decorator_1.Permissions)('technical-tender:view'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "reviews", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    (0, permissions_decorator_1.AnyPermission)('technical-tender:review-technical', 'technical-tender:review-commercial'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.RequestTenderReviewDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "requestReview", null);
__decorate([
    (0, common_1.Post)(':id/reviews/:reviewId/decision'),
    (0, permissions_decorator_1.AnyPermission)('technical-tender:review-technical', 'technical-tender:review-commercial'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('reviewId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, technical_center_dto_1.DecideTenderReviewDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "decideReview", null);
__decorate([
    (0, common_1.Get)(':id/requirements'),
    (0, permissions_decorator_1.Permissions)('technical-tender:view'),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "requirements", null);
__decorate([
    (0, common_1.Post)(':id/requirements'),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.CreateRequirementDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "addRequirement", null);
__decorate([
    (0, common_1.Patch)(':id/requirements/:requirementId'),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('requirementId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, technical_center_dto_1.UpdateRequirementDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "updateRequirement", null);
__decorate([
    (0, common_1.Delete)(':id/requirements/:requirementId'),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('requirementId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "removeRequirement", null);
__decorate([
    (0, common_1.Post)(':id/deliverables'),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, technical_center_dto_1.CreateDeliverableDto, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "addDeliverable", null);
__decorate([
    (0, common_1.Delete)(':id/deliverables/:deliverableId'),
    (0, permissions_decorator_1.Permissions)('technical-tender:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('deliverableId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TechnicalTendersController.prototype, "removeDeliverable", null);
exports.TechnicalTendersController = TechnicalTendersController = __decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiTags)('Technical tenders'),
    (0, common_1.Controller)('technical/tenders'),
    __metadata("design:paramtypes", [technical_center_service_1.TechnicalCenterService])
], TechnicalTendersController);
//# sourceMappingURL=technical-center.controller.js.map