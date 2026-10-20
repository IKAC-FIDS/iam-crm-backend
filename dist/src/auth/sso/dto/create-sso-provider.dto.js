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
exports.SsoGroupRoleMappingDto = exports.CreateSsoProviderDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateSsoProviderDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2 }, type: { required: true, type: () => Object }, isActive: { required: false, type: () => Boolean }, autoProvision: { required: false, type: () => Boolean }, defaultRole: { required: false, type: () => Object }, allowedDomains: { required: false, type: () => [String] }, routingDomains: { required: false, type: () => [String] }, routingSubdomains: { required: false, type: () => [String] }, groupRoleMappings: { required: false, type: () => [require("./create-sso-provider.dto").SsoGroupRoleMappingDto] }, issuer: { required: false, type: () => String }, clientId: { required: false, type: () => String }, clientSecret: { required: false, type: () => String, description: "Plain secret is accepted only on write.\nIt must be encrypted into clientSecretEnc and must never be returned." }, authorizationUrl: { required: false, type: () => String }, tokenUrl: { required: false, type: () => String }, userInfoUrl: { required: false, type: () => String }, jwksUrl: { required: false, type: () => String }, scopes: { required: false, type: () => [String] }, entityId: { required: false, type: () => String }, ssoUrl: { required: false, type: () => String }, x509Certificate: { required: false, type: () => String }, signRequests: { required: false, type: () => Boolean }, wantAssertionsSigned: { required: false, type: () => Boolean }, wantResponseSigned: { required: false, type: () => Boolean }, emailAttribute: { required: false, type: () => String }, nameAttribute: { required: false, type: () => String }, groupsAttribute: { required: false, type: () => String } };
    }
}
exports.CreateSsoProviderDto = CreateSsoProviderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SsoProviderType),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSsoProviderDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSsoProviderDto.prototype, "autoProvision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "defaultRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSsoProviderDto.prototype, "allowedDomains", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSsoProviderDto.prototype, "routingDomains", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSsoProviderDto.prototype, "routingSubdomains", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SsoGroupRoleMappingDto),
    __metadata("design:type", Array)
], CreateSsoProviderDto.prototype, "groupRoleMappings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "issuer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "clientSecret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "authorizationUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "tokenUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "userInfoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "jwksUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSsoProviderDto.prototype, "scopes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "ssoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "x509Certificate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSsoProviderDto.prototype, "signRequests", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSsoProviderDto.prototype, "wantAssertionsSigned", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSsoProviderDto.prototype, "wantResponseSigned", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "emailAttribute", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "nameAttribute", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSsoProviderDto.prototype, "groupsAttribute", void 0);
class SsoGroupRoleMappingDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { group: { required: true, type: () => String, minLength: 1 }, roleId: { required: true, type: () => String, minLength: 1 } };
    }
}
exports.SsoGroupRoleMappingDto = SsoGroupRoleMappingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SsoGroupRoleMappingDto.prototype, "group", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SsoGroupRoleMappingDto.prototype, "roleId", void 0);
//# sourceMappingURL=create-sso-provider.dto.js.map