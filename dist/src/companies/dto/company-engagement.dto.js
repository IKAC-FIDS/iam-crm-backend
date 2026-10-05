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
exports.UpdateCompanyPinDto = exports.UpdateCompanyEngagementDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpdateCompanyEngagementDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object }, reason: { required: false, type: () => String, maxLength: 500 }, nextReviewAt: { required: false, type: () => Date } };
    }
}
exports.UpdateCompanyEngagementDto = UpdateCompanyEngagementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CompanyEngagementStatus }),
    (0, class_validator_1.IsEnum)(client_1.CompanyEngagementStatus),
    __metadata("design:type", String)
], UpdateCompanyEngagementDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 500 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateCompanyEngagementDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: String, format: "date-time" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], UpdateCompanyEngagementDto.prototype, "nextReviewAt", void 0);
class UpdateCompanyPinDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { isPinned: { required: true, type: () => Boolean } };
    }
}
exports.UpdateCompanyPinDto = UpdateCompanyPinDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCompanyPinDto.prototype, "isPinned", void 0);
//# sourceMappingURL=company-engagement.dto.js.map