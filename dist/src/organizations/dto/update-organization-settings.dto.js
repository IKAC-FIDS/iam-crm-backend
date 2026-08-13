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
exports.UpdateOrganizationSettingsDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class UpdateOrganizationSettingsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { timezone: { required: false, type: () => String }, locale: { required: false, type: () => String }, calendarSystem: { required: false, type: () => Object }, dateFormat: { required: false, type: () => Object }, firstDayOfWeek: { required: false, type: () => Number, minimum: 0, maximum: 6 }, emailSenderDisplayName: { required: false, type: () => String, nullable: true, maxLength: 120 }, allowPasswordLogin: { required: false, type: () => Boolean }, allowPasskeyLogin: { required: false, type: () => Boolean } };
    }
}
exports.UpdateOrganizationSettingsDto = UpdateOrganizationSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsTimeZone)(),
    __metadata("design:type", String)
], UpdateOrganizationSettingsDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsLocale)(),
    __metadata("design:type", String)
], UpdateOrganizationSettingsDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OrganizationCalendarSystem),
    __metadata("design:type", String)
], UpdateOrganizationSettingsDto.prototype, "calendarSystem", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OrganizationDateFormat),
    __metadata("design:type", String)
], UpdateOrganizationSettingsDto.prototype, "dateFormat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], UpdateOrganizationSettingsDto.prototype, "firstDayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", Object)
], UpdateOrganizationSettingsDto.prototype, "emailSenderDisplayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrganizationSettingsDto.prototype, "allowPasswordLogin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrganizationSettingsDto.prototype, "allowPasskeyLogin", void 0);
//# sourceMappingURL=update-organization-settings.dto.js.map