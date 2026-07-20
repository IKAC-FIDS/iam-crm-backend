"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRatesModule = void 0;
const common_1 = require("@nestjs/common");
const product_catalog_module_1 = require("../../product-catalog/product-catalog.module");
const exchange_rates_controller_1 = require("./exchange-rates.controller");
const exchange_rates_service_1 = require("./exchange-rates.service");
let ExchangeRatesModule = class ExchangeRatesModule {
};
exports.ExchangeRatesModule = ExchangeRatesModule;
exports.ExchangeRatesModule = ExchangeRatesModule = __decorate([
    (0, common_1.Module)({ imports: [product_catalog_module_1.ProductCatalogModule], controllers: [exchange_rates_controller_1.ExchangeRatesController], providers: [exchange_rates_service_1.ExchangeRatesService] })
], ExchangeRatesModule);
//# sourceMappingURL=exchange-rates.module.js.map