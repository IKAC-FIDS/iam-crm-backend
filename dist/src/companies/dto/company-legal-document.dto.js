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
exports.UpdateCompanyLegalDocumentDto = exports.UploadCompanyLegalDocumentDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const emptyToUndefined = ({ value }) => value === '' || value === null || value === undefined ? undefined : value;
class UploadCompanyLegalDocumentDto {
}
exports.UploadCompanyLegalDocumentDto = UploadCompanyLegalDocumentDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CompanyLegalDocumentType),
    __metadata("design:type", String)
], UploadCompanyLegalDocumentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UploadCompanyLegalDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UploadCompanyLegalDocumentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCompanyLegalDocumentDto.prototype, "documentDate", void 0);
class UpdateCompanyLegalDocumentDto {
}
exports.UpdateCompanyLegalDocumentDto = UpdateCompanyLegalDocumentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CompanyLegalDocumentType),
    __metadata("design:type", String)
], UpdateCompanyLegalDocumentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCompanyLegalDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateCompanyLegalDocumentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UpdateCompanyLegalDocumentDto.prototype, "documentDate", void 0);
//# sourceMappingURL=company-legal-document.dto.js.map