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
exports.AddCollaborationChannelMemberDto = exports.UpdateCollaborationChannelDto = exports.CreateCollaborationChannelDto = exports.UpdateCollaborationTopicDto = exports.CreateCollaborationTopicDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateCollaborationTopicDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 1, maxLength: 120 }, description: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.CreateCollaborationTopicDto = CreateCollaborationTopicDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateCollaborationTopicDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateCollaborationTopicDto.prototype, "description", void 0);
class UpdateCollaborationTopicDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, minLength: 1, maxLength: 120 }, description: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.UpdateCollaborationTopicDto = UpdateCollaborationTopicDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateCollaborationTopicDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateCollaborationTopicDto.prototype, "description", void 0);
class CreateCollaborationChannelDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 1, maxLength: 80 }, description: { required: false, type: () => String, maxLength: 500 }, visibility: { required: true, type: () => Object }, initialMemberIds: { required: false, type: () => [String] } };
    }
}
exports.CreateCollaborationChannelDto = CreateCollaborationChannelDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateCollaborationChannelDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateCollaborationChannelDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CollaborationChannelVisibility),
    __metadata("design:type", String)
], CreateCollaborationChannelDto.prototype, "visibility", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateCollaborationChannelDto.prototype, "initialMemberIds", void 0);
class UpdateCollaborationChannelDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, minLength: 1, maxLength: 80 }, description: { required: false, type: () => String, maxLength: 500 }, visibility: { required: false, type: () => Object } };
    }
}
exports.UpdateCollaborationChannelDto = UpdateCollaborationChannelDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateCollaborationChannelDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateCollaborationChannelDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CollaborationChannelVisibility),
    __metadata("design:type", String)
], UpdateCollaborationChannelDto.prototype, "visibility", void 0);
class AddCollaborationChannelMemberDto {
    constructor() {
        this.role = client_1.CollaborationChannelMemberRole.MEMBER;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String }, role: { required: true, type: () => Object, default: client_1.CollaborationChannelMemberRole.MEMBER } };
    }
}
exports.AddCollaborationChannelMemberDto = AddCollaborationChannelMemberDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddCollaborationChannelMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CollaborationChannelMemberRole),
    __metadata("design:type", String)
], AddCollaborationChannelMemberDto.prototype, "role", void 0);
//# sourceMappingURL=collaboration.dto.js.map