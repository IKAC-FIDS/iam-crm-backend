"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductCatalogItemDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_product_catalog_item_dto_1 = require("./create-product-catalog-item.dto");
class UpdateProductCatalogItemDto extends (0, mapped_types_1.PartialType)(create_product_catalog_item_dto_1.CreateProductCatalogItemDto) {
}
exports.UpdateProductCatalogItemDto = UpdateProductCatalogItemDto;
//# sourceMappingURL=update-product-catalog-item.dto.js.map