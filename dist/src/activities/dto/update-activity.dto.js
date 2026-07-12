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
exports.UpdateActivityDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const emptyStringToNull = ({ value }) => typeof value === 'string' && value.trim() === '' ? null : value;
class UpdateActivityDto {
}
exports.UpdateActivityDto = UpdateActivityDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ActivityType),
    __metadata("design:type", String)
], UpdateActivityDto.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Transform)(emptyStringToNull),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateActivityDto.prototype, "personId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(emptyStringToNull),
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", Object)
], UpdateActivityDto.prototype, "occurredAt", void 0);
__decorate([
    (0, class_transformer_1.Transform)(emptyStringToNull),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateActivityDto.prototype, "notes", void 0);
__decorate([
    (0, class_transformer_1.Transform)(emptyStringToNull),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateActivityDto.prototype, "outcome", void 0);
__decorate([
    (0, class_transformer_1.Transform)(emptyStringToNull),
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", Object)
], UpdateActivityDto.prototype, "nextActionDate", void 0);
__decorate([
    (0, class_transformer_1.Transform)(emptyStringToNull),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateActivityDto.prototype, "opportunityId", void 0);
//# sourceMappingURL=update-activity.dto.js.map