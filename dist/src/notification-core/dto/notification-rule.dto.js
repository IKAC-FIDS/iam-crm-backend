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
exports.UpdateNotificationRuleDto = exports.CreateNotificationRuleDto = exports.NotificationRecipientRuleInputDto = exports.NotificationScheduleInputDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class NotificationScheduleInputDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: false, type: () => Boolean }, type: { required: true, type: () => Object }, sourceField: { required: true, type: () => String }, triggerMode: { required: true, type: () => Object }, offsetMinutes: { required: true, type: () => Number }, gracePeriodMinutes: { required: false, type: () => Number, minimum: 1, maximum: 525600 } };
    }
}
exports.NotificationScheduleInputDto = NotificationScheduleInputDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationScheduleInputDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationScheduleType),
    __metadata("design:type", String)
], NotificationScheduleInputDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], NotificationScheduleInputDto.prototype, "sourceField", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationScheduleTriggerMode),
    __metadata("design:type", String)
], NotificationScheduleInputDto.prototype, "triggerMode", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], NotificationScheduleInputDto.prototype, "offsetMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(525600),
    __metadata("design:type", Number)
], NotificationScheduleInputDto.prototype, "gracePeriodMinutes", void 0);
class NotificationRecipientRuleInputDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => Object }, targetId: { required: false, type: () => String, nullable: true }, channels: { required: true, type: () => [Object] }, enabled: { required: false, type: () => Boolean } };
    }
}
exports.NotificationRecipientRuleInputDto = NotificationRecipientRuleInputDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationRecipientType),
    __metadata("design:type", String)
], NotificationRecipientRuleInputDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], NotificationRecipientRuleInputDto.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel, { each: true }),
    __metadata("design:type", Array)
], NotificationRecipientRuleInputDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationRecipientRuleInputDto.prototype, "enabled", void 0);
class CreateNotificationRuleDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, eventName: { required: true, type: () => String }, enabled: { required: false, type: () => Boolean }, mandatory: { required: false, type: () => Boolean }, priority: { required: false, type: () => Number, minimum: 0, maximum: 10000 }, conditions: { required: false, type: () => Object, nullable: true }, schedule: { required: false, type: () => require("./notification-rule.dto").NotificationScheduleInputDto, nullable: true }, recipientRules: { required: true, type: () => [require("./notification-rule.dto").NotificationRecipientRuleInputDto] } };
    }
}
exports.CreateNotificationRuleDto = CreateNotificationRuleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNotificationRuleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNotificationRuleDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNotificationRuleDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNotificationRuleDto.prototype, "mandatory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10000),
    __metadata("design:type", Number)
], CreateNotificationRuleDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateNotificationRuleDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NotificationScheduleInputDto),
    __metadata("design:type", Object)
], CreateNotificationRuleDto.prototype, "schedule", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NotificationRecipientRuleInputDto),
    __metadata("design:type", Array)
], CreateNotificationRuleDto.prototype, "recipientRules", void 0);
class UpdateNotificationRuleDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String }, eventName: { required: false, type: () => String }, enabled: { required: false, type: () => Boolean }, mandatory: { required: false, type: () => Boolean }, priority: { required: false, type: () => Number, minimum: 0, maximum: 10000 }, conditions: { required: false, type: () => Object, nullable: true }, schedule: { required: false, type: () => require("./notification-rule.dto").NotificationScheduleInputDto, nullable: true }, recipientRules: { required: false, type: () => [require("./notification-rule.dto").NotificationRecipientRuleInputDto] } };
    }
}
exports.UpdateNotificationRuleDto = UpdateNotificationRuleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateNotificationRuleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateNotificationRuleDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationRuleDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationRuleDto.prototype, "mandatory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10000),
    __metadata("design:type", Number)
], UpdateNotificationRuleDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateNotificationRuleDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NotificationScheduleInputDto),
    __metadata("design:type", Object)
], UpdateNotificationRuleDto.prototype, "schedule", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => NotificationRecipientRuleInputDto),
    __metadata("design:type", Array)
], UpdateNotificationRuleDto.prototype, "recipientRules", void 0);
//# sourceMappingURL=notification-rule.dto.js.map