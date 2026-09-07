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
exports.NotificationDeliveryQueryDto = exports.UpdateNotificationTemplateDto = exports.CreateNotificationTemplateDto = exports.PreviewNotificationTemplateDto = exports.NotificationTemplateQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class NotificationTemplateQueryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eventName: { required: false, type: () => String }, channel: { required: false, type: () => Object }, locale: { required: false, type: () => String }, search: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean } };
    }
}
exports.NotificationTemplateQueryDto = NotificationTemplateQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationTemplateQueryDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel),
    __metadata("design:type", String)
], NotificationTemplateQueryDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationTemplateQueryDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationTemplateQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === "true" ? true : value === "false" ? false : value),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationTemplateQueryDto.prototype, "isActive", void 0);
class PreviewNotificationTemplateDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eventName: { required: true, type: () => String }, channel: { required: true, type: () => Object }, locale: { required: false, type: () => String }, subject: { required: false, type: () => String, nullable: true }, body: { required: true, type: () => String } };
    }
}
exports.PreviewNotificationTemplateDto = PreviewNotificationTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PreviewNotificationTemplateDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel),
    __metadata("design:type", String)
], PreviewNotificationTemplateDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PreviewNotificationTemplateDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], PreviewNotificationTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PreviewNotificationTemplateDto.prototype, "body", void 0);
class CreateNotificationTemplateDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eventName: { required: true, type: () => String }, channel: { required: true, type: () => Object }, locale: { required: false, type: () => String }, subject: { required: false, type: () => String, nullable: true }, body: { required: true, type: () => String }, isActive: { required: false, type: () => Boolean }, version: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.CreateNotificationTemplateDto = CreateNotificationTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateNotificationTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNotificationTemplateDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateNotificationTemplateDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateNotificationTemplateDto.prototype, "version", void 0);
class UpdateNotificationTemplateDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { eventName: { required: false, type: () => String }, channel: { required: false, type: () => Object }, locale: { required: false, type: () => String }, subject: { required: false, type: () => String, nullable: true }, body: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean }, version: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.UpdateNotificationTemplateDto = UpdateNotificationTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateNotificationTemplateDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel),
    __metadata("design:type", String)
], UpdateNotificationTemplateDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateNotificationTemplateDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateNotificationTemplateDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateNotificationTemplateDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationTemplateDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateNotificationTemplateDto.prototype, "version", void 0);
class NotificationDeliveryQueryDto {
    constructor() {
        this.page = 1;
        this.pageSize = 20;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: true, type: () => Object, default: 1, minimum: 1 }, pageSize: { required: true, type: () => Object, default: 20, minimum: 1, maximum: 100 }, eventName: { required: false, type: () => String }, channel: { required: false, type: () => Object }, status: { required: false, type: () => Object }, recipientUserId: { required: false, type: () => String }, dateFrom: { required: false, type: () => String }, dateTo: { required: false, type: () => String }, search: { required: false, type: () => String } };
    }
}
exports.NotificationDeliveryQueryDto = NotificationDeliveryQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], NotificationDeliveryQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], NotificationDeliveryQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationDeliveryStatus),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "recipientUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationDeliveryQueryDto.prototype, "search", void 0);
//# sourceMappingURL=notification-admin.dto.js.map