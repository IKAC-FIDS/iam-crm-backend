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
exports.FindCompaniesDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const ownership_scope_dto_1 = require("../../common/dto/ownership-scope.dto");
class FindCompaniesDto extends pagination_dto_1.PaginationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { ownershipScope: { required: false, enum: require("../../common/dto/ownership-scope.dto").OwnershipScope }, stage: { required: false, type: () => Object }, priority: { required: false, type: () => Object }, industryId: { required: false, type: () => String }, industry: { required: false, type: () => String, description: "Deprecated compatibility filter.\nPrefer industryId." }, sourceId: { required: false, type: () => String }, source: { required: false, type: () => String, description: "Deprecated compatibility filter.\nPrefer sourceId." }, withoutOwner: { required: false, type: () => String }, search: { required: false, type: () => String }, ownerId: { required: false, type: () => String }, includeArchived: { required: false, type: () => String }, archivedOnly: { required: false, type: () => String } };
    }
}
exports.FindCompaniesDto = FindCompaniesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ownership_scope_dto_1.OwnershipScope),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "ownershipScope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LegacyPipelineStage),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Priority),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "industryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "sourceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "withoutOwner", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "includeArchived", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], FindCompaniesDto.prototype, "archivedOnly", void 0);
//# sourceMappingURL=find-companies.dto.js.map