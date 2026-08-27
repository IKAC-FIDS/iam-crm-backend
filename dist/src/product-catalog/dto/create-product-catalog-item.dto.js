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
exports.CreateProductCatalogItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const decimalString = ({ value }) => value === undefined || value === null ? value : String(value);
class CreateProductCatalogItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, maxLength: 80 }, digikalaCode: { required: false, type: () => String, nullable: true, maxLength: 80 }, digikalaUrl: { required: false, type: () => String, nullable: true, maxLength: 2000 }, name: { required: true, type: () => String, maxLength: 200 }, description: { required: false, type: () => String }, category: { required: false, type: () => String, maxLength: 120 }, unit: { required: false, type: () => String, maxLength: 40 }, defaultUnitPrice: { required: false, type: () => String }, currency: { required: false, type: () => String, maxLength: 10 }, pricingCurrency: { required: false, type: () => Object }, inPersonInputPrice: { required: false, type: () => String }, digikalaInputPrice: { required: false, type: () => String }, inPersonProfitPercent: { required: false, type: () => String }, digikalaProfitPercent: { required: false, type: () => String }, isActive: { required: false, type: () => Boolean }, sortOrder: { required: false, type: () => Number } };
    }
}
exports.CreateProductCatalogItemDto = CreateProductCatalogItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", Object)
], CreateProductCatalogItemDto.prototype, "digikalaCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({ protocols: ['http', 'https'], require_protocol: true }),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", Object)
], CreateProductCatalogItemDto.prototype, "digikalaUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(decimalString),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '0,6', force_decimal: false }),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "defaultUnitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PricingCurrency),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "pricingCurrency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(decimalString),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '0,6', force_decimal: false }),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "inPersonInputPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(decimalString),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '0,6', force_decimal: false }),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "digikalaInputPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(decimalString),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '0,3', force_decimal: false }),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "inPersonProfitPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(decimalString),
    (0, class_validator_1.IsDecimal)({ decimal_digits: '0,3', force_decimal: false }),
    __metadata("design:type", String)
], CreateProductCatalogItemDto.prototype, "digikalaProfitPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductCatalogItemDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductCatalogItemDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=create-product-catalog-item.dto.js.map