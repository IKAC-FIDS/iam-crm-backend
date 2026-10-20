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
exports.RuleOrchestrationDto = exports.UpdateEscalationPolicyDto = exports.CreateEscalationPolicyDto = exports.EscalationStepDto = exports.UpdateDigestPolicyDto = exports.CreateDigestPolicyDto = exports.UpdateQuietHoursDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const mapped_types_1 = require("@nestjs/mapped-types");
class UpdateQuietHoursDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: true, type: () => Boolean }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, timezone: { required: true, type: () => String }, channels: { required: true, type: () => [Object] }, allowCritical: { required: true, type: () => Boolean }, mode: { required: true, type: () => Object } };
    }
}
exports.UpdateQuietHoursDto = UpdateQuietHoursDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateQuietHoursDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateQuietHoursDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateQuietHoursDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateQuietHoursDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], UpdateQuietHoursDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateQuietHoursDto.prototype, "allowCritical", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationQuietHoursMode),
    __metadata("design:type", String)
], UpdateQuietHoursDto.prototype, "mode", void 0);
class CreateDigestPolicyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, enabled: { required: false, type: () => Boolean }, frequency: { required: false, type: () => String }, sendTime: { required: true, type: () => String }, timezone: { required: true, type: () => String }, subjectTemplate: { required: false, type: () => String }, introText: { required: false, type: () => String }, eventNames: { required: true, type: () => [String] }, channels: { required: true, type: () => [Object] } };
    }
}
exports.CreateDigestPolicyDto = CreateDigestPolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDigestPolicyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateDigestPolicyDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationDigestFrequency),
    __metadata("design:type", String)
], CreateDigestPolicyDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDigestPolicyDto.prototype, "sendTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDigestPolicyDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDigestPolicyDto.prototype, "subjectTemplate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDigestPolicyDto.prototype, "introText", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateDigestPolicyDto.prototype, "eventNames", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], CreateDigestPolicyDto.prototype, "channels", void 0);
class UpdateDigestPolicyDto extends (0, mapped_types_1.PartialType)(CreateDigestPolicyDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateDigestPolicyDto = UpdateDigestPolicyDto;
class EscalationStepDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { delayMinutes: { required: true, type: () => Number, minimum: 0, maximum: 43200 }, recipientType: { required: true, type: () => Object }, targetId: { required: false, type: () => String, nullable: true }, channels: { required: true, type: () => [Object] }, priority: { required: false, type: () => Object }, mandatory: { required: false, type: () => Boolean } };
    }
}
exports.EscalationStepDto = EscalationStepDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(43200),
    __metadata("design:type", Number)
], EscalationStepDto.prototype, "delayMinutes", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationRecipientType),
    __metadata("design:type", String)
], EscalationStepDto.prototype, "recipientType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], EscalationStepDto.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], EscalationStepDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationPriority),
    __metadata("design:type", String)
], EscalationStepDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], EscalationStepDto.prototype, "mandatory", void 0);
class CreateEscalationPolicyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, enabled: { required: false, type: () => Boolean }, eventName: { required: true, type: () => String }, aggregateType: { required: false, type: () => String }, conditions: { required: false, type: () => Object, nullable: true }, steps: { required: true, type: () => [require("./notification-orchestration.dto").EscalationStepDto] } };
    }
}
exports.CreateEscalationPolicyDto = CreateEscalationPolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEscalationPolicyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateEscalationPolicyDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEscalationPolicyDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEscalationPolicyDto.prototype, "aggregateType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateEscalationPolicyDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => EscalationStepDto),
    __metadata("design:type", Array)
], CreateEscalationPolicyDto.prototype, "steps", void 0);
class UpdateEscalationPolicyDto extends (0, mapped_types_1.PartialType)(CreateEscalationPolicyDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateEscalationPolicyDto = UpdateEscalationPolicyDto;
class RuleOrchestrationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { deliveryPriority: { required: false, type: () => Object }, digestPolicyId: { required: false, type: () => String, nullable: true } };
    }
}
exports.RuleOrchestrationDto = RuleOrchestrationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationPriority),
    __metadata("design:type", String)
], RuleOrchestrationDto.prototype, "deliveryPriority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], RuleOrchestrationDto.prototype, "digestPolicyId", void 0);
//# sourceMappingURL=notification-orchestration.dto.js.map