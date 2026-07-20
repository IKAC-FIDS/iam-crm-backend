"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCatalogModule = void 0;
const common_1 = require("@nestjs/common");
const product_catalog_controller_1 = require("./product-catalog.controller");
const product_catalog_service_1 = require("./product-catalog.service");
const product_pricing_service_1 = require("./product-pricing.service");
const product_price_history_service_1 = require("./product-price-history.service");
let ProductCatalogModule = class ProductCatalogModule {
};
exports.ProductCatalogModule = ProductCatalogModule;
exports.ProductCatalogModule = ProductCatalogModule = __decorate([
    (0, common_1.Module)({
        controllers: [product_catalog_controller_1.ProductCatalogController],
        providers: [
            product_catalog_service_1.ProductCatalogService,
            product_pricing_service_1.ProductPricingService,
            product_price_history_service_1.ProductPriceHistoryService,
        ],
        exports: [
            product_catalog_service_1.ProductCatalogService,
            product_pricing_service_1.ProductPricingService,
            product_price_history_service_1.ProductPriceHistoryService,
        ],
    })
], ProductCatalogModule);
//# sourceMappingURL=product-catalog.module.js.map