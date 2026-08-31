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
exports.ArtifactsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const artifacts_service_1 = require("./artifacts.service");
const artifact_dto_1 = require("./dto/artifact.dto");
let ArtifactsController = class ArtifactsController {
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) { return this.service.findAll(query, user); }
    upload(dto, file, user) { return this.service.upload(dto, file, user); }
    external(dto, user) { return this.service.createExternal(dto, user); }
    findOne(id, user) { return this.service.findOne(id, user); }
    update(id, dto, user) { return this.service.update(id, dto, user); }
    remove(id, user) { return this.service.remove(id, user); }
    links(id, user) { return this.service.links(id, user); }
    link(id, dto, user) { return this.service.link(id, dto, user); }
    unlink(id, linkId, user) { return this.service.unlink(id, linkId, user); }
};
exports.ArtifactsController = ArtifactsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.AnyPermission)('artifact:view', 'attachment:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [artifact_dto_1.FindArtifactsDto, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, permissions_decorator_1.AnyPermission)('artifact:create', 'attachment:manage'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 25 * 1024 * 1024 } })),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [artifact_dto_1.UploadArtifactDto, Object, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "upload", null);
__decorate([
    (0, common_1.Post)('external'),
    (0, permissions_decorator_1.AnyPermission)('artifact:create', 'attachment:manage'),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [artifact_dto_1.CreateExternalArtifactDto, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "external", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.AnyPermission)('artifact:view', 'attachment:view'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.AnyPermission)('artifact:update', 'attachment:manage'),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, artifact_dto_1.UpdateArtifactDto, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.AnyPermission)('artifact:delete', 'attachment:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/links'),
    (0, permissions_decorator_1.AnyPermission)('artifact:view', 'attachment:view'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "links", null);
__decorate([
    (0, common_1.Post)(':id/links'),
    (0, permissions_decorator_1.AnyPermission)('artifact:link', 'attachment:manage'),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, artifact_dto_1.CreateArtifactLinkDto, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "link", null);
__decorate([
    (0, common_1.Delete)(':id/links/:linkId'),
    (0, permissions_decorator_1.AnyPermission)('artifact:link', 'attachment:manage'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('linkId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ArtifactsController.prototype, "unlink", null);
exports.ArtifactsController = ArtifactsController = __decorate([
    (0, common_1.Controller)('artifacts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [artifacts_service_1.ArtifactsService])
], ArtifactsController);
//# sourceMappingURL=artifacts.controller.js.map