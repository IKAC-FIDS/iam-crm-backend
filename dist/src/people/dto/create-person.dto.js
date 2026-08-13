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
exports.CreatePersonDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const person_contact_dto_1 = require("./person-contact.dto");
const person_social_dto_1 = require("./person-social.dto");
class CreatePersonDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { companyId: { required: true, type: () => String }, fullName: { required: true, type: () => String }, title: { required: false, type: () => String }, jobTitle: { required: false, type: () => String }, department: { required: false, type: () => String }, personaTag: { required: false, type: () => String }, personaRole: { required: false, type: () => String }, seniorityLevel: { required: false, type: () => String }, linkedinUrl: { required: false, type: () => String }, email: { required: false, type: () => String }, phone: { required: false, type: () => String }, isPrimaryContact: { required: false, type: () => Boolean }, isSecondaryContact: { required: false, type: () => Boolean }, contacts: { required: false, type: () => [require("./person-contact.dto").CreatePersonContactDto] }, socials: { required: false, type: () => [require("./person-social.dto").CreatePersonSocialDto] } };
    }
}
exports.CreatePersonDto = CreatePersonDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "jobTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "personaTag", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "personaRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "seniorityLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "linkedinUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePersonDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePersonDto.prototype, "isPrimaryContact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePersonDto.prototype, "isSecondaryContact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => person_contact_dto_1.CreatePersonContactDto),
    __metadata("design:type", Array)
], CreatePersonDto.prototype, "contacts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => person_social_dto_1.CreatePersonSocialDto),
    __metadata("design:type", Array)
], CreatePersonDto.prototype, "socials", void 0);
//# sourceMappingURL=create-person.dto.js.map