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
exports.CreateOrganizationDomainDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateOrganizationDomainDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => Object }, hostname: { required: true, type: () => String, maxLength: 253 } };
    }
}
exports.CreateOrganizationDomainDto = CreateOrganizationDomainDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.OrganizationDomainType),
    __metadata("design:type", String)
], CreateOrganizationDomainDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(253),
    __metadata("design:type", String)
], CreateOrganizationDomainDto.prototype, "hostname", void 0);
//# sourceMappingURL=create-organization-domain.dto.js.map