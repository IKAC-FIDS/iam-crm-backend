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
exports.AccountWorkspaceQueryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
class AccountWorkspaceQueryDto {
    constructor() {
        this.recentLimit = 5;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { startDate: { required: false, type: () => String }, endDate: { required: false, type: () => String }, recentLimit: { required: true, type: () => Object, default: 5, minimum: 3, maximum: 10 } };
    }
}
exports.AccountWorkspaceQueryDto = AccountWorkspaceQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], AccountWorkspaceQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], AccountWorkspaceQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(3),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Object)
], AccountWorkspaceQueryDto.prototype, "recentLimit", void 0);
//# sourceMappingURL=account-workspace-query.dto.js.map