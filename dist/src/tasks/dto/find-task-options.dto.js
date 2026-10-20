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
exports.FindTaskEntityOptionsDto = exports.FindTaskOptionsDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class FindTaskOptionsDto {
    constructor() {
        this.page = 1;
        this.limit = 25;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { search: { required: false, type: () => String }, page: { required: true, type: () => Object, default: 1, minimum: 1 }, limit: { required: true, type: () => Object, default: 25, minimum: 1, maximum: 50 } };
    }
}
exports.FindTaskOptionsDto = FindTaskOptionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindTaskOptionsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], FindTaskOptionsDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Object)
], FindTaskOptionsDto.prototype, "limit", void 0);
class FindTaskEntityOptionsDto extends FindTaskOptionsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => Object, enum: ['COMPANY', 'OPPORTUNITY', 'PERSON', 'MEETING', 'ACTIVITY', 'PRODUCT'] } };
    }
}
exports.FindTaskEntityOptionsDto = FindTaskEntityOptionsDto;
__decorate([
    (0, class_validator_1.IsIn)(['COMPANY', 'OPPORTUNITY', 'PERSON', 'MEETING', 'ACTIVITY', 'PRODUCT']),
    __metadata("design:type", String)
], FindTaskEntityOptionsDto.prototype, "type", void 0);
//# sourceMappingURL=find-task-options.dto.js.map