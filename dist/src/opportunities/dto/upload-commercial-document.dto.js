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
exports.UploadCommercialDocumentDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const emptyToUndefined = ({ value }) => value === '' || value === null || value === undefined ? undefined : value;
const optionalNumber = ({ value }) => {
    if (value === '' || value === null || value === undefined) {
        return undefined;
    }
    return Number(value);
};
const optionalBoolean = ({ value }) => {
    if (value === '' || value === null || value === undefined) {
        return undefined;
    }
    if (value === true || value === 'true' || value === '1') {
        return true;
    }
    if (value === false || value === 'false' || value === '0') {
        return false;
    }
    return value;
};
class UploadCommercialDocumentDto {
}
exports.UploadCommercialDocumentDto = UploadCommercialDocumentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsEnum)(client_1.CommercialDocumentType),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsEnum)(client_1.CommercialDocumentType),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsEnum)(client_1.CommercialDocumentStatus),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(optionalNumber),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UploadCommercialDocumentDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(optionalNumber),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UploadCommercialDocumentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "validUntil", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "issuedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "issueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "sentAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "acceptedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "rejectedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "signedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(optionalBoolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadCommercialDocumentDto.prototype, "isSigned", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "fileUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "externalUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "externalRef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadCommercialDocumentDto.prototype, "notes", void 0);
//# sourceMappingURL=upload-commercial-document.dto.js.map