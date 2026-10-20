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
exports.FindCompanyLegalDocumentsDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
class FindCompanyLegalDocumentsDto extends pagination_dto_1.PaginationDto {
    constructor() {
        super(...arguments);
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: false, type: () => Object }, search: { required: false, type: () => String }, dateFrom: { required: false, type: () => String }, dateTo: { required: false, type: () => String }, sortBy: { required: false, type: () => Object, default: "createdAt", enum: ['createdAt', 'documentDate'] }, sortOrder: { required: false, type: () => Object, default: "desc", enum: ['asc', 'desc'] } };
    }
}
exports.FindCompanyLegalDocumentsDto = FindCompanyLegalDocumentsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CompanyLegalDocumentType),
    __metadata("design:type", String)
], FindCompanyLegalDocumentsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindCompanyLegalDocumentsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindCompanyLegalDocumentsDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindCompanyLegalDocumentsDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['createdAt', 'documentDate']),
    __metadata("design:type", String)
], FindCompanyLegalDocumentsDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], FindCompanyLegalDocumentsDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=find-company-legal-documents.dto.js.map