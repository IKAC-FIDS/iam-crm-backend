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
exports.TestEmailDto = exports.UpdateEmailSettingsDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateEmailSettingsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: true, type: () => Boolean }, host: { required: true, type: () => String, maxLength: 255 }, port: { required: true, type: () => Number, minimum: 1, maximum: 65535 }, secure: { required: true, type: () => Boolean }, username: { required: false, type: () => String, maxLength: 255 }, password: { required: false, type: () => String, maxLength: 1000 }, fromEmail: { required: true, type: () => String, maxLength: 320 }, fromName: { required: false, type: () => String, maxLength: 200 }, replyTo: { required: false, type: () => String, maxLength: 320 } };
    }
}
exports.UpdateEmailSettingsDto = UpdateEmailSettingsDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEmailSettingsDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateEmailSettingsDto.prototype, "host", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], UpdateEmailSettingsDto.prototype, "port", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateEmailSettingsDto.prototype, "secure", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateEmailSettingsDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateEmailSettingsDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(320),
    __metadata("design:type", String)
], UpdateEmailSettingsDto.prototype, "fromEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateEmailSettingsDto.prototype, "fromName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(320),
    __metadata("design:type", String)
], UpdateEmailSettingsDto.prototype, "replyTo", void 0);
class TestEmailDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { to: { required: true, type: () => String, maxLength: 320 } };
    }
}
exports.TestEmailDto = TestEmailDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(320),
    __metadata("design:type", String)
], TestEmailDto.prototype, "to", void 0);
//# sourceMappingURL=email-settings.dto.js.map