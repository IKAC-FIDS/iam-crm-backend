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
exports.TestPushDto = exports.UpdatePushSettingsDto = exports.RegisterPushSubscriptionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class PushKeysDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { p256dh: { required: true, type: () => String, maxLength: 1000 }, auth: { required: true, type: () => String, maxLength: 1000 } };
    }
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], PushKeysDto.prototype, "p256dh", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], PushKeysDto.prototype, "auth", void 0);
class RegisterPushSubscriptionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { endpoint: { required: true, type: () => String, maxLength: 4000 }, expirationTime: { required: false, type: () => Number, nullable: true }, keys: { required: true, type: () => PushKeysDto }, label: { required: false, type: () => String, maxLength: 120 } };
    }
}
exports.RegisterPushSubscriptionDto = RegisterPushSubscriptionDto;
__decorate([
    (0, class_validator_1.IsUrl)({ require_protocol: true, protocols: ["https"] }, { message: "آدرس اشتراک پوش باید HTTPS باشد" }),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], RegisterPushSubscriptionDto.prototype, "endpoint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], RegisterPushSubscriptionDto.prototype, "expirationTime", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PushKeysDto),
    __metadata("design:type", PushKeysDto)
], RegisterPushSubscriptionDto.prototype, "keys", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], RegisterPushSubscriptionDto.prototype, "label", void 0);
class UpdatePushSettingsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { provider: { required: true, type: () => String, enum: ["WEB_PUSH"] }, publicKey: { required: false, type: () => String, maxLength: 1000 }, privateKey: { required: false, type: () => String, maxLength: 2000 }, clearPrivateKey: { required: false, type: () => Boolean }, subject: { required: false, type: () => String, maxLength: 500 }, enabled: { required: true, type: () => Boolean }, timeoutMs: { required: false, type: () => Number, minimum: 1000, maximum: 60000 } };
    }
}
exports.UpdatePushSettingsDto = UpdatePushSettingsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(["WEB_PUSH"]),
    __metadata("design:type", String)
], UpdatePushSettingsDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdatePushSettingsDto.prototype, "publicKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdatePushSettingsDto.prototype, "privateKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePushSettingsDto.prototype, "clearPrivateKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdatePushSettingsDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePushSettingsDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1000),
    (0, class_validator_1.Max)(60000),
    __metadata("design:type", Number)
], UpdatePushSettingsDto.prototype, "timeoutMs", void 0);
class TestPushDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { recipientUserId: { required: true, type: () => String }, title: { required: false, type: () => String, maxLength: 200 }, body: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.TestPushDto = TestPushDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TestPushDto.prototype, "recipientUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], TestPushDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TestPushDto.prototype, "body", void 0);
//# sourceMappingURL=push.dto.js.map