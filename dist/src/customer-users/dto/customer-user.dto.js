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
exports.RecoveryCustomerAdminDto = exports.InvitationParamDto = exports.MembershipParamDto = exports.UpdateCustomerMembershipDto = exports.InviteCustomerDto = exports.SetCompanyPortalEnabledDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class SetCompanyPortalEnabledDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: true, type: () => Boolean } };
    }
}
exports.SetCompanyPortalEnabledDto = SetCompanyPortalEnabledDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetCompanyPortalEnabledDto.prototype, "enabled", void 0);
class InviteCustomerDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String }, role: { required: true, type: () => Object } };
    }
}
exports.InviteCustomerDto = InviteCustomerDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], InviteCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CustomerRole),
    __metadata("design:type", String)
], InviteCustomerDto.prototype, "role", void 0);
class UpdateCustomerMembershipDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { role: { required: false, type: () => Object }, status: { required: false, type: () => Object } };
    }
}
exports.UpdateCustomerMembershipDto = UpdateCustomerMembershipDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRole),
    __metadata("design:type", String)
], UpdateCustomerMembershipDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerMembershipStatus),
    __metadata("design:type", String)
], UpdateCustomerMembershipDto.prototype, "status", void 0);
class MembershipParamDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { membershipId: { required: true, type: () => String } };
    }
}
exports.MembershipParamDto = MembershipParamDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], MembershipParamDto.prototype, "membershipId", void 0);
class InvitationParamDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { invitationId: { required: true, type: () => String } };
    }
}
exports.InvitationParamDto = InvitationParamDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InvitationParamDto.prototype, "invitationId", void 0);
class RecoveryCustomerAdminDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { email: { required: true, type: () => String } };
    }
}
exports.RecoveryCustomerAdminDto = RecoveryCustomerAdminDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RecoveryCustomerAdminDto.prototype, "email", void 0);
//# sourceMappingURL=customer-user.dto.js.map