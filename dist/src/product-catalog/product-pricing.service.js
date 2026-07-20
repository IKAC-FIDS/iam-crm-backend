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
exports.ProductPricingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductPricingService = class ProductPricingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async calculate(input, client = this.prisma) {
        const inPersonInputPrice = this.nonNegative(input.inPersonInputPrice, 'inPersonInputPrice');
        const digikalaInputPrice = this.nonNegative(input.digikalaInputPrice, 'digikalaInputPrice');
        const calculatedAt = new Date();
        if (input.pricingCurrency === client_1.PricingCurrency.IRR) {
            if (input.inPersonProfitPercent != null || input.digikalaProfitPercent != null)
                throw new common_1.BadRequestException('Profit percentages must be null for IRR pricing');
            return { pricingCurrency: client_1.PricingCurrency.IRR, inPersonInputPrice, digikalaInputPrice, inPersonProfitPercent: null, digikalaProfitPercent: null, inPersonPriceIrr: inPersonInputPrice.toDecimalPlaces(0, client_1.Prisma.Decimal.ROUND_HALF_UP), digikalaPriceIrr: digikalaInputPrice.toDecimalPlaces(0, client_1.Prisma.Decimal.ROUND_HALF_UP), calculatedExchangeRateId: null, priceCalculatedAt: calculatedAt };
        }
        const inPersonProfitPercent = this.profit(input.inPersonProfitPercent, 'inPersonProfitPercent');
        const digikalaProfitPercent = this.profit(input.digikalaProfitPercent, 'digikalaProfitPercent');
        const rate = await client.currencyExchangeRate.findFirst({ where: { baseCurrency: 'USD', quoteCurrency: 'IRR', validFrom: { lte: calculatedAt }, validTo: null }, orderBy: { validFrom: 'desc' } });
        if (!rate)
            throw new common_1.BadRequestException('An active USD to IRR exchange rate is required');
        return this.calculateUsd(input, rate.id, rate.rate, calculatedAt, inPersonProfitPercent, digikalaProfitPercent);
    }
    calculateUsd(input, rateId, rateValue, calculatedAt = new Date(), inPersonProfit = this.profit(input.inPersonProfitPercent, 'inPersonProfitPercent'), digikalaProfit = this.profit(input.digikalaProfitPercent, 'digikalaProfitPercent')) {
        const rate = new client_1.Prisma.Decimal(rateValue);
        if (rate.lessThanOrEqualTo(0))
            throw new common_1.BadRequestException('Exchange rate must be greater than zero');
        const inPersonInputPrice = this.nonNegative(input.inPersonInputPrice, 'inPersonInputPrice'), digikalaInputPrice = this.nonNegative(input.digikalaInputPrice, 'digikalaInputPrice');
        const final = (price, profit) => price.mul(rate).mul(new client_1.Prisma.Decimal(1).plus(profit.div(100))).toDecimalPlaces(0, client_1.Prisma.Decimal.ROUND_HALF_UP);
        return { pricingCurrency: client_1.PricingCurrency.USD, inPersonInputPrice, digikalaInputPrice, inPersonProfitPercent: inPersonProfit, digikalaProfitPercent: digikalaProfit, inPersonPriceIrr: final(inPersonInputPrice, inPersonProfit), digikalaPriceIrr: final(digikalaInputPrice, digikalaProfit), calculatedExchangeRateId: rateId, priceCalculatedAt: calculatedAt };
    }
    nonNegative(value, field) { let d; try {
        d = new client_1.Prisma.Decimal(value);
    }
    catch {
        throw new common_1.BadRequestException(`${field} must be a decimal string`);
    } if (d.lessThan(0))
        throw new common_1.BadRequestException(`${field} cannot be negative`); return d; }
    profit(value, field) { if (value == null)
        throw new common_1.BadRequestException(`${field} is required for USD pricing`); const d = this.nonNegative(value, field); if (d.greaterThan(1000))
        throw new common_1.BadRequestException(`${field} cannot exceed 1000`); return d; }
};
exports.ProductPricingService = ProductPricingService;
exports.ProductPricingService = ProductPricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductPricingService);
//# sourceMappingURL=product-pricing.service.js.map