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
exports.UpdatePersonEducationHistoryDto = exports.CreatePersonEducationHistoryDto = exports.UpdatePersonEmploymentPositionDto = exports.CreatePersonEmploymentPositionDto = exports.UpdatePersonEmploymentHistoryDto = exports.CreatePersonEmploymentHistoryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const emptyToUndefined = ({ value }) => value === '' || value === null || value === undefined ? undefined : value;
class CreatePersonEmploymentHistoryDto {
}
exports.CreatePersonEmploymentHistoryDto = CreatePersonEmploymentHistoryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePersonEmploymentHistoryDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreatePersonEmploymentHistoryDto.prototype, "description", void 0);
class UpdatePersonEmploymentHistoryDto extends (0, mapped_types_1.PartialType)(CreatePersonEmploymentHistoryDto) {
}
exports.UpdatePersonEmploymentHistoryDto = UpdatePersonEmploymentHistoryDto;
class CreatePersonEmploymentPositionDto {
}
exports.CreatePersonEmploymentPositionDto = CreatePersonEmploymentPositionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreatePersonEmploymentPositionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreatePersonEmploymentPositionDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreatePersonEmploymentPositionDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePersonEmploymentPositionDto.prototype, "isCurrent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreatePersonEmploymentPositionDto.prototype, "description", void 0);
class UpdatePersonEmploymentPositionDto extends (0, mapped_types_1.PartialType)(CreatePersonEmploymentPositionDto) {
}
exports.UpdatePersonEmploymentPositionDto = UpdatePersonEmploymentPositionDto;
class CreatePersonEducationHistoryDto {
}
exports.CreatePersonEducationHistoryDto = CreatePersonEducationHistoryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsEnum)(client_1.PersonEducationDegree),
    __metadata("design:type", String)
], CreatePersonEducationHistoryDto.prototype, "degree", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePersonEducationHistoryDto.prototype, "universityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreatePersonEducationHistoryDto.prototype, "educationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreatePersonEducationHistoryDto.prototype, "description", void 0);
class UpdatePersonEducationHistoryDto extends (0, mapped_types_1.PartialType)(CreatePersonEducationHistoryDto) {
}
exports.UpdatePersonEducationHistoryDto = UpdatePersonEducationHistoryDto;
//# sourceMappingURL=person-history.dto.js.map