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
exports.lifecycleEnums = exports.DecideTenderReviewDto = exports.RequestTenderReviewDto = exports.CreateDeliverableDto = exports.CreateRequirementTaskDto = exports.LinkRequirementTaskDto = exports.RequirementDependencyDto = exports.UpdateRequirementDto = exports.CreateRequirementDto = exports.UpdateTenderQualificationDto = exports.KnowledgeCategoryOptionsDto = exports.UpdateTenderDto = exports.CreateTenderDto = exports.UpdateResourceDto = exports.CreateResourceDto = exports.CreateDocumentVersionDto = exports.UpdateDocumentDto = exports.CreateDocumentDto = exports.UpdateKnowledgeDto = exports.CreateKnowledgeDto = exports.UpdateReleaseDto = exports.CreateReleaseDto = exports.TenderTransitionDto = exports.DocumentTransitionDto = exports.KnowledgeTransitionDto = exports.ReleaseTransitionDto = exports.TransitionDto = exports.TechnicalDocumentListDto = exports.TechnicalListDto = void 0;
const openapi = require("@nestjs/swagger");
const mapped_types_1 = require("@nestjs/mapped-types");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
class TechnicalListDto extends pagination_dto_1.PaginationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { search: { required: false, type: () => String, maxLength: 200 }, productId: { required: false, type: () => String }, releaseId: { required: false, type: () => String }, companyId: { required: false, type: () => String }, opportunityId: { required: false, type: () => String }, ownerId: { required: false, type: () => String }, teamId: { required: false, type: () => String }, status: { required: false, type: () => String }, type: { required: false, type: () => String }, version: { required: false, type: () => String, maxLength: 80 }, category: { required: false, type: () => String, maxLength: 120 }, visibility: { required: false, type: () => Object }, authorId: { required: false, type: () => String }, reviewDue: { required: false, type: () => String }, sort: { required: false, type: () => String, maxLength: 40 }, sortDirection: { required: false, type: () => Object, enum: ['asc', 'desc'] }, from: { required: false, type: () => String }, to: { required: false, type: () => String } };
    }
}
exports.TechnicalListDto = TechnicalListDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "releaseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TechnicalVisibility),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "authorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "reviewDue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "sort", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "sortDirection", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], TechnicalListDto.prototype, "to", void 0);
class TechnicalDocumentListDto extends TechnicalListDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { tenderId: { required: false, type: () => String }, confidentiality: { required: false, type: () => Object } };
    }
}
exports.TechnicalDocumentListDto = TechnicalDocumentListDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TechnicalDocumentListDto.prototype, "tenderId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.TechnicalConfidentiality }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TechnicalConfidentiality),
    __metadata("design:type", String)
], TechnicalDocumentListDto.prototype, "confidentiality", void 0);
class TransitionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => String }, reason: { required: false, type: () => String, maxLength: 1000 }, revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.TransitionDto = TransitionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TransitionDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TransitionDto.prototype, "revision", void 0);
class ReleaseTransitionDto extends TransitionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object } };
    }
}
exports.ReleaseTransitionDto = ReleaseTransitionDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TechnicalReleaseStatus),
    __metadata("design:type", String)
], ReleaseTransitionDto.prototype, "status", void 0);
class KnowledgeTransitionDto extends TransitionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object } };
    }
}
exports.KnowledgeTransitionDto = KnowledgeTransitionDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.KnowledgeBaseStatus),
    __metadata("design:type", String)
], KnowledgeTransitionDto.prototype, "status", void 0);
class DocumentTransitionDto extends TransitionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object } };
    }
}
exports.DocumentTransitionDto = DocumentTransitionDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TechnicalDocumentStatus),
    __metadata("design:type", String)
], DocumentTransitionDto.prototype, "status", void 0);
class TenderTransitionDto extends TransitionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object } };
    }
}
exports.TenderTransitionDto = TenderTransitionDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TenderStatus),
    __metadata("design:type", String)
], TenderTransitionDto.prototype, "status", void 0);
class CreateReleaseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { productId: { required: true, type: () => String }, version: { required: true, type: () => String, minLength: 1, maxLength: 80 }, title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, summary: { required: false, type: () => String, maxLength: 1000 }, releaseNotes: { required: false, type: () => String }, releaseDate: { required: false, type: () => String }, supportStartDate: { required: false, type: () => String }, supportEndDate: { required: false, type: () => String }, endOfLifeDate: { required: false, type: () => String } };
    }
}
exports.CreateReleaseDto = CreateReleaseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "releaseNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "releaseDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "supportStartDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "supportEndDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateReleaseDto.prototype, "endOfLifeDate", void 0);
class UpdateReleaseDto extends (0, mapped_types_1.PartialType)(CreateReleaseDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return { revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.UpdateReleaseDto = UpdateReleaseDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateReleaseDto.prototype, "revision", void 0);
class CreateKnowledgeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, slug: { required: true, type: () => String, minLength: 1, maxLength: 160 }, content: { required: false, type: () => String, nullable: true, minLength: 1, maxLength: 100000 }, contentType: { required: false, type: () => Object }, externalUrl: { required: false, type: () => String, nullable: true, maxLength: 2000 }, summary: { required: false, type: () => String, nullable: true, maxLength: 1000 }, category: { required: false, type: () => String, nullable: true, maxLength: 120 }, visibility: { required: false, type: () => Object }, productId: { required: false, type: () => String, nullable: true }, releaseId: { required: false, type: () => String, nullable: true }, ownerId: { required: false, type: () => String, nullable: true }, reviewerId: { required: false, type: () => String, nullable: true }, nextReviewAt: { required: false, type: () => String, nullable: true } };
    }
}
exports.CreateKnowledgeDto = CreateKnowledgeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateKnowledgeDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 160),
    __metadata("design:type", String)
], CreateKnowledgeDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100000),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.KnowledgeContentType),
    __metadata("design:type", String)
], CreateKnowledgeDto.prototype, "contentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }, { message: 'externalUrl must be a valid URL' }),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "externalUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TechnicalVisibility),
    __metadata("design:type", String)
], CreateKnowledgeDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "releaseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "reviewerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", Object)
], CreateKnowledgeDto.prototype, "nextReviewAt", void 0);
class UpdateKnowledgeDto extends (0, mapped_types_1.PartialType)(CreateKnowledgeDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateKnowledgeDto = UpdateKnowledgeDto;
class CreateDocumentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, documentType: { required: true, type: () => String, minLength: 1, maxLength: 100 }, ownerId: { required: true, type: () => String }, description: { required: false, type: () => String, maxLength: 4000 }, confidentiality: { required: false, type: () => Object }, productId: { required: false, type: () => String }, releaseId: { required: false, type: () => String }, companyId: { required: false, type: () => String }, opportunityId: { required: false, type: () => String }, tenderId: { required: false, type: () => String }, effectiveFrom: { required: false, type: () => String }, expiresAt: { required: false, type: () => String } };
    }
}
exports.CreateDocumentDto = CreateDocumentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TechnicalConfidentiality),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "confidentiality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "releaseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "tenderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "effectiveFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "expiresAt", void 0);
class UpdateDocumentDto extends (0, mapped_types_1.PartialType)(CreateDocumentDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return { revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.UpdateDocumentDto = UpdateDocumentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateDocumentDto.prototype, "revision", void 0);
class CreateDocumentVersionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { version: { required: true, type: () => String, minLength: 1, maxLength: 80 }, attachmentId: { required: false, type: () => String }, contentHash: { required: false, type: () => String, maxLength: 128 } };
    }
}
exports.CreateDocumentVersionDto = CreateDocumentVersionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], CreateDocumentVersionDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDocumentVersionDto.prototype, "attachmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateDocumentVersionDto.prototype, "contentHash", void 0);
class CreateResourceDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, resourceType: { required: true, type: () => Object }, description: { required: false, type: () => String, maxLength: 4000 }, productId: { required: false, type: () => String }, releaseId: { required: false, type: () => String }, url: { required: false, type: () => String }, version: { required: false, type: () => String, maxLength: 80 }, checksum: { required: false, type: () => String, maxLength: 128 }, ownerId: { required: false, type: () => String } };
    }
}
exports.CreateResourceDto = CreateResourceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TechnicalResourceType),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "releaseId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(128),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "checksum", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResourceDto.prototype, "ownerId", void 0);
class UpdateResourceDto extends (0, mapped_types_1.PartialType)(CreateResourceDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return { attachmentId: { required: false, type: () => String }, status: { required: false, type: () => Object } };
    }
}
exports.UpdateResourceDto = UpdateResourceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "attachmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TechnicalResourceStatus),
    __metadata("design:type", String)
], UpdateResourceDto.prototype, "status", void 0);
class CreateTenderDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, tenderType: { required: true, type: () => Object }, ownerId: { required: true, type: () => String }, referenceNumber: { required: false, type: () => String, maxLength: 100 }, companyId: { required: false, type: () => String }, opportunityId: { required: false, type: () => String }, teamId: { required: false, type: () => String }, source: { required: false, type: () => String, maxLength: 120 }, description: { required: false, type: () => String, maxLength: 10000 }, submissionDeadline: { required: false, type: () => String }, technicalDeadline: { required: false, type: () => String }, expectedDecisionDate: { required: false, type: () => String }, estimatedValue: { required: false, type: () => String }, currency: { required: false, type: () => String, minLength: 3, maxLength: 3 }, probability: { required: false, type: () => Number, minimum: 0, maximum: 100 }, technicalLeadId: { required: false, type: () => String }, commercialLeadId: { required: false, type: () => String } };
    }
}
exports.CreateTenderDto = CreateTenderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TenderType),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "tenderType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "referenceNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "submissionDeadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "technicalDeadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "expectedDecisionDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "estimatedValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(3, 3),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateTenderDto.prototype, "probability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "technicalLeadId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTenderDto.prototype, "commercialLeadId", void 0);
class UpdateTenderDto extends (0, mapped_types_1.PartialType)(CreateTenderDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return { revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.UpdateTenderDto = UpdateTenderDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateTenderDto.prototype, "revision", void 0);
class KnowledgeCategoryOptionsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { search: { required: false, type: () => String, maxLength: 120 } };
    }
}
exports.KnowledgeCategoryOptionsDto = KnowledgeCategoryOptionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], KnowledgeCategoryOptionsDto.prototype, "search", void 0);
class UpdateTenderQualificationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { bidDecision: { required: false, type: () => Object }, qualificationDecision: { required: false, type: () => Object }, fitScore: { required: false, type: () => Number, minimum: 0, maximum: 100 }, riskScore: { required: false, type: () => Number, minimum: 0, maximum: 100 }, feasibilityScore: { required: false, type: () => Number, minimum: 0, maximum: 100 }, fitNotes: { required: false, type: () => String, maxLength: 10000 }, riskNotes: { required: false, type: () => String, maxLength: 10000 }, feasibilityNotes: { required: false, type: () => String, maxLength: 10000 }, qualificationSummary: { required: false, type: () => String, maxLength: 20000 }, qualificationConditions: { required: false, type: () => String, maxLength: 20000 }, decisionReason: { required: false, type: () => String, maxLength: 10000 }, revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.UpdateTenderQualificationDto = UpdateTenderQualificationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TenderBidDecision),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "bidDecision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TenderQualificationDecision),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "qualificationDecision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateTenderQualificationDto.prototype, "fitScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateTenderQualificationDto.prototype, "riskScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateTenderQualificationDto.prototype, "feasibilityScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "fitNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "riskNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "feasibilityNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20000),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "qualificationSummary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20000),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "qualificationConditions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], UpdateTenderQualificationDto.prototype, "decisionReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateTenderQualificationDto.prototype, "revision", void 0);
class CreateRequirementDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, category: { required: false, type: () => String, maxLength: 120 }, description: { required: false, type: () => String, maxLength: 10000 }, section: { required: false, type: () => String, maxLength: 120 }, page: { required: false, type: () => String, maxLength: 40 }, referenceId: { required: false, type: () => String, maxLength: 120 }, notes: { required: false, type: () => String, maxLength: 10000 }, parentRequirementId: { required: false, type: () => String, nullable: true }, dependencyIds: { required: false, type: () => [String] }, mandatory: { required: false, type: () => Boolean }, ownerId: { required: false, type: () => String, nullable: true }, dueDate: { required: false, type: () => String }, response: { required: false, type: () => String, maxLength: 20000 }, status: { required: false, type: () => Object }, blockedReason: { required: false, type: () => String, maxLength: 2000 } };
    }
}
exports.CreateRequirementDto = CreateRequirementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "section", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "referenceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateRequirementDto.prototype, "parentRequirementId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateRequirementDto.prototype, "dependencyIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateRequirementDto.prototype, "mandatory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateRequirementDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20000),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "response", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TenderRequirementStatus),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateRequirementDto.prototype, "blockedReason", void 0);
class UpdateRequirementDto extends (0, mapped_types_1.PartialType)(CreateRequirementDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateRequirementDto = UpdateRequirementDto;
class RequirementDependencyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { dependsOnRequirementId: { required: true, type: () => String } };
    }
}
exports.RequirementDependencyDto = RequirementDependencyDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequirementDependencyDto.prototype, "dependsOnRequirementId", void 0);
class LinkRequirementTaskDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { taskId: { required: true, type: () => String } };
    }
}
exports.LinkRequirementTaskDto = LinkRequirementTaskDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LinkRequirementTaskDto.prototype, "taskId", void 0);
class CreateRequirementTaskDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: false, type: () => String, maxLength: 200 }, description: { required: false, type: () => String, maxLength: 10000 }, priority: { required: false, type: () => Object }, dueAt: { required: false, type: () => String }, assignedToId: { required: false, type: () => String }, assignmentScope: { required: false, type: () => Object }, teamId: { required: false, type: () => String } };
    }
}
exports.CreateRequirementTaskDto = CreateRequirementTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Priority),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "dueAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "assignedToId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskAssignmentScope),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "assignmentScope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRequirementTaskDto.prototype, "teamId", void 0);
class CreateDeliverableDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { documentId: { required: true, type: () => String }, label: { required: false, type: () => String, maxLength: 200 }, required: { required: false, type: () => Boolean } };
    }
}
exports.CreateDeliverableDto = CreateDeliverableDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "documentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDeliverableDto.prototype, "required", void 0);
class RequestTenderReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => Object }, reviewerId: { required: false, type: () => String }, comment: { required: false, type: () => String, maxLength: 2000 }, revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.RequestTenderReviewDto = RequestTenderReviewDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TenderReviewType),
    __metadata("design:type", String)
], RequestTenderReviewDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestTenderReviewDto.prototype, "reviewerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RequestTenderReviewDto.prototype, "comment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RequestTenderReviewDto.prototype, "revision", void 0);
class DecideTenderReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object }, comment: { required: false, type: () => String, maxLength: 2000 }, revision: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.DecideTenderReviewDto = DecideTenderReviewDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TenderReviewStatus),
    __metadata("design:type", String)
], DecideTenderReviewDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], DecideTenderReviewDto.prototype, "comment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DecideTenderReviewDto.prototype, "revision", void 0);
exports.lifecycleEnums = {
    release: client_1.TechnicalReleaseStatus,
    knowledge: client_1.KnowledgeBaseStatus,
    document: client_1.TechnicalDocumentStatus,
    tender: client_1.TenderStatus,
};
//# sourceMappingURL=technical-center.dto.js.map