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
exports.TestSmsDto = exports.UpdateSmsSettingsDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpdateSmsSettingsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { provider: { required: true, type: () => String, maxLength: 80 }, apiUrl: { required: true, type: () => String, maxLength: 2000 }, apiKey: { required: false, type: () => String, maxLength: 2000 }, clearApiKey: { required: false, type: () => Boolean }, senderNumber: { required: true, type: () => String, maxLength: 80 }, enabled: { required: true, type: () => Boolean }, timeoutMs: { required: false, type: () => Number, minimum: 1000, maximum: 60000 } };
    }
}
exports.UpdateSmsSettingsDto = UpdateSmsSettingsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateSmsSettingsDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateSmsSettingsDto.prototype, "apiUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateSmsSettingsDto.prototype, "apiKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSmsSettingsDto.prototype, "clearApiKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateSmsSettingsDto.prototype, "senderNumber", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSmsSettingsDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(60000),
    __metadata("design:type", Number)
], UpdateSmsSettingsDto.prototype, "timeoutMs", void 0);
class TestSmsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { recipient: { required: true, type: () => String, maxLength: 40 }, message: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.TestSmsDto = TestSmsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], TestSmsDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TestSmsDto.prototype, "message", void 0);
//# sourceMappingURL=sms-settings.dto.js.map