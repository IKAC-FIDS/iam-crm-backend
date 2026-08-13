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
exports.UpdatePersonSocialDto = exports.CreatePersonSocialDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePersonSocialDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { platformOptionId: { required: false, type: () => String }, platform: { required: false, type: () => String, description: "Deprecated compatibility input.\nPrefer platformOptionId.\nIf sent, it must match LookupOption.code or LookupOption.label in group = social_types." }, handle: { required: true, type: () => String }, isPrimary: { required: false, type: () => Boolean }, note: { required: false, type: () => String } };
    }
}
exports.CreatePersonSocialDto = CreatePersonSocialDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePersonSocialDto.prototype, "platformOptionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonSocialDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonSocialDto.prototype, "handle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePersonSocialDto.prototype, "isPrimary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonSocialDto.prototype, "note", void 0);
class UpdatePersonSocialDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { platformOptionId: { required: false, type: () => String }, platform: { required: false, type: () => String, description: "Deprecated compatibility input.\nPrefer platformOptionId." }, handle: { required: false, type: () => String }, isPrimary: { required: false, type: () => Boolean }, note: { required: false, type: () => String } };
    }
}
exports.UpdatePersonSocialDto = UpdatePersonSocialDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdatePersonSocialDto.prototype, "platformOptionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePersonSocialDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePersonSocialDto.prototype, "handle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePersonSocialDto.prototype, "isPrimary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePersonSocialDto.prototype, "note", void 0);
//# sourceMappingURL=person-social.dto.js.map