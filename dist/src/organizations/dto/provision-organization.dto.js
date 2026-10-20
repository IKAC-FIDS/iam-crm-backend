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
exports.ProvisionOrganizationDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ProvisionOrganizationDto {
    constructor() {
        this.defaultTeamCode = 'default';
        this.defaultTeamName = 'Default Team';
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { ownerUserId: { required: true, type: () => String }, defaultTeamCode: { required: true, type: () => String, default: "default", maxLength: 80, pattern: "/^[a-z0-9][a-z0-9-_]*$/" }, defaultTeamName: { required: true, type: () => String, default: "Default Team", maxLength: 200 } };
    }
}
exports.ProvisionOrganizationDto = ProvisionOrganizationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ProvisionOrganizationDto.prototype, "ownerUserId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    (0, class_validator_1.Matches)(/^[a-z0-9][a-z0-9-_]*$/),
    __metadata("design:type", String)
], ProvisionOrganizationDto.prototype, "defaultTeamCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], ProvisionOrganizationDto.prototype, "defaultTeamName", void 0);
//# sourceMappingURL=provision-organization.dto.js.map