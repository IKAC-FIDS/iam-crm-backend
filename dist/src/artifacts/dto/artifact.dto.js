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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindArtifactsDto = exports.CreateArtifactLinkDto = exports.UpdateArtifactDto = exports.CreateExternalArtifactDto = exports.UploadArtifactDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const upload_attachment_dto_1 = require("../../attachments/dto/upload-attachment.dto");
class UploadArtifactDto extends upload_attachment_dto_1.UploadAttachmentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { category: { required: false, type: () => String, maxLength: 100 }, tags: { required: false, type: () => [String] }, versionLabel: { required: false, type: () => String, maxLength: 100 }, confidentiality: { required: false, type: () => String, maxLength: 100 } };
    }
}
exports.UploadArtifactDto = UploadArtifactDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UploadArtifactDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UploadArtifactDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UploadArtifactDto.prototype, "versionLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UploadArtifactDto.prototype, "confidentiality", void 0);
class CreateExternalArtifactDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, maxLength: 240 }, externalUrl: { required: true, type: () => String }, provider: { required: true, type: () => Object }, description: { required: false, type: () => String, maxLength: 2000 }, entityType: { required: true, type: () => Object }, entityId: { required: true, type: () => String }, relationType: { required: false, type: () => Object }, category: { required: false, type: () => String, maxLength: 100 }, tags: { required: false, type: () => [String] }, versionLabel: { required: false, type: () => String, maxLength: 100 }, confidentiality: { required: false, type: () => String, maxLength: 100 }, metadata: { required: false, type: () => Object } };
    }
}
exports.CreateExternalArtifactDto = CreateExternalArtifactDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'], require_protocol: true }),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "externalUrl", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ArtifactProvider),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.FileAttachmentEntityType),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ArtifactRelationType),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "relationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateExternalArtifactDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "versionLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateExternalArtifactDto.prototype, "confidentiality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateExternalArtifactDto.prototype, "metadata", void 0);
class UpdateArtifactDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, maxLength: 240 }, description: { required: false, type: () => String, maxLength: 2000 }, category: { required: false, type: () => String, maxLength: 100 }, tags: { required: false, type: () => [String] }, versionLabel: { required: false, type: () => String, maxLength: 100 }, confidentiality: { required: false, type: () => String, maxLength: 100 }, metadata: { required: false, type: () => Object } };
    }
}
exports.UpdateArtifactDto = UpdateArtifactDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], UpdateArtifactDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateArtifactDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateArtifactDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateArtifactDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateArtifactDto.prototype, "versionLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateArtifactDto.prototype, "confidentiality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateArtifactDto.prototype, "metadata", void 0);
class CreateArtifactLinkDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { entityType: { required: true, type: () => Object }, entityId: { required: true, type: () => String }, relationType: { required: false, type: () => Object } };
    }
}
exports.CreateArtifactLinkDto = CreateArtifactLinkDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.FileAttachmentEntityType),
    __metadata("design:type", String)
], CreateArtifactLinkDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateArtifactLinkDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ArtifactRelationType),
    __metadata("design:type", String)
], CreateArtifactLinkDto.prototype, "relationType", void 0);
class FindArtifactsDto extends pagination_dto_1.PaginationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { entityType: { required: false, type: () => Object }, entityId: { required: false, type: () => String }, type: { required: false, type: () => Object }, provider: { required: false, type: () => Object }, relationType: { required: false, type: () => Object }, search: { required: false, type: () => String, maxLength: 200 }, createdFrom: { required: false, type: () => String }, createdTo: { required: false, type: () => String } };
    }
}
exports.FindArtifactsDto = FindArtifactsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.FileAttachmentEntityType),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ArtifactType),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ArtifactProvider),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ArtifactRelationType),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "relationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "createdFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FindArtifactsDto.prototype, "createdTo", void 0);
//# sourceMappingURL=artifact.dto.js.map