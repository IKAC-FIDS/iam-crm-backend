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
exports.AssignMembershipRoleDto = exports.ReplaceTenantRolePermissionsDto = exports.UpdateTenantRoleDto = exports.CreateTenantRoleDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const trim = ({ value }) => typeof value === 'string' ? value.trim() : value;
const normalizeCode = ({ value }) => typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]+/g, '_') : value;
class CreateTenantRoleDto {
}
exports.CreateTenantRoleDto = CreateTenantRoleDto;
__decorate([
    (0, class_transformer_1.Transform)(normalizeCode),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Z][A-Z0-9_]*$/),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateTenantRoleDto.prototype, "code", void 0);
__decorate([
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateTenantRoleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateTenantRoleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], CreateTenantRoleDto.prototype, "baseRole", void 0);
class UpdateTenantRoleDto {
}
exports.UpdateTenantRoleDto = UpdateTenantRoleDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateTenantRoleDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateTenantRoleDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTenantRoleDto.prototype, "isActive", void 0);
class ReplaceTenantRolePermissionsDto {
}
exports.ReplaceTenantRolePermissionsDto = ReplaceTenantRolePermissionsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ReplaceTenantRolePermissionsDto.prototype, "permissionIds", void 0);
class AssignMembershipRoleDto {
}
exports.AssignMembershipRoleDto = AssignMembershipRoleDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], AssignMembershipRoleDto.prototype, "roleId", void 0);
//# sourceMappingURL=tenant-rbac.dto.js.map