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
exports.CompanyRegistryLookupDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CompanyRegistryLookupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { nationalId: { required: true, type: () => String, pattern: "/^\\d{11}$/" } };
    }
}
exports.CompanyRegistryLookupDto = CompanyRegistryLookupDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string'
        ? value
            .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
            .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
            .trim()
        : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{11}$/, { message: 'شناسه ملی شرکت باید ۱۱ رقم باشد' }),
    __metadata("design:type", String)
], CompanyRegistryLookupDto.prototype, "nationalId", void 0);
//# sourceMappingURL=company-registry-lookup.dto.js.map