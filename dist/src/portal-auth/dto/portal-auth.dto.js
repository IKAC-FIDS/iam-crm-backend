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
exports.AcceptCustomerInvitationDto = exports.PortalSwitchCompanyDto = exports.PortalSelectCompanyDto = exports.PortalLoginDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PortalLoginDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, password: { required: true, type: () => String, minLength: 8 }, companyId: { required: false, type: () => String } };
    }
}
exports.PortalLoginDto = PortalLoginDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], PortalLoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], PortalLoginDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PortalLoginDto.prototype, "companyId", void 0);
class PortalSelectCompanyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { selectionToken: { required: true, type: () => String }, companyId: { required: true, type: () => String } };
    }
}
exports.PortalSelectCompanyDto = PortalSelectCompanyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PortalSelectCompanyDto.prototype, "selectionToken", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PortalSelectCompanyDto.prototype, "companyId", void 0);
class PortalSwitchCompanyDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { companyId: { required: true, type: () => String } };
    }
}
exports.PortalSwitchCompanyDto = PortalSwitchCompanyDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PortalSwitchCompanyDto.prototype, "companyId", void 0);
class AcceptCustomerInvitationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { token: { required: true, type: () => String, minLength: 32, maxLength: 512 }, password: { required: true, type: () => String, minLength: 8 }, fullName: { required: false, type: () => String, minLength: 2, maxLength: 160 } };
    }
}
exports.AcceptCustomerInvitationDto = AcceptCustomerInvitationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(32, 512),
    __metadata("design:type", String)
], AcceptCustomerInvitationDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AcceptCustomerInvitationDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], AcceptCustomerInvitationDto.prototype, "fullName", void 0);
//# sourceMappingURL=portal-auth.dto.js.map