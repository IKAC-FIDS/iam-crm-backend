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
exports.ProductPriceHistoryService = void 0;
const common_1 = require("@nestjs/common");
const api_date_util_1 = require("../common/dates/api-date.util");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductPriceHistoryService = class ProductPriceHistoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(productId, query) {
        const product = await this.prisma.productCatalogItem.findUnique({
            where: { id: productId },
            select: { id: true },
        });
        if (!product)
            throw new common_1.NotFoundException("Product not found");
        const page = query.page ?? 1, limit = query.limit ?? 20;
        const range = (0, api_date_util_1.parseApiDateRange)(query.dateFrom, query.dateTo, "dateFrom", "dateTo");
        const where = {
            productId,
            ...(query.reason && { reason: query.reason }),
            ...(range && { validFrom: range }),
        };
        const [data, total] = await Promise.all([
            this.prisma.productPriceHistory.findMany({
                where,
                select: {
                    id: true,
                    productId: true,
                    pricingCurrency: true,
                    inPersonInputPrice: true,
                    digikalaInputPrice: true,
                    inPersonProfitPercent: true,
                    digikalaProfitPercent: true,
                    inPersonPriceIrr: true,
                    digikalaPriceIrr: true,
                    calculatedExchangeRateId: true,
                    exchangeRateValueSnapshot: true,
                    reason: true,
                    validFrom: true,
                    validTo: true,
                    changedBy: { select: { id: true, fullName: true, email: true } },
                    note: true,
                    createdAt: true,
                },
                orderBy: [{ validFrom: "desc" }, { id: "desc" }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.productPriceHistory.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async append(client, productId, snapshot, reason, validFrom, changedById, note) {
        const rate = snapshot.calculatedExchangeRateId
            ? await client.currencyExchangeRate.findUnique({
                where: { id: snapshot.calculatedExchangeRateId },
                select: { rate: true },
            })
            : null;
        await client.productPriceHistory.updateMany({
            where: { productId, validTo: null },
            data: { validTo: validFrom },
        });
        return client.productPriceHistory.create({
            data: {
                productId,
                pricingCurrency: snapshot.pricingCurrency,
                inPersonInputPrice: snapshot.inPersonInputPrice,
                digikalaInputPrice: snapshot.digikalaInputPrice,
                inPersonProfitPercent: snapshot.inPersonProfitPercent,
                digikalaProfitPercent: snapshot.digikalaProfitPercent,
                inPersonPriceIrr: snapshot.inPersonPriceIrr,
                digikalaPriceIrr: snapshot.digikalaPriceIrr,
                calculatedExchangeRateId: snapshot.calculatedExchangeRateId,
                exchangeRateValueSnapshot: rate?.rate ?? null,
                reason,
                validFrom,
                changedById,
                note: note?.trim() || null,
            },
        });
    }
};
exports.ProductPriceHistoryService = ProductPriceHistoryService;
exports.ProductPriceHistoryService = ProductPriceHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductPriceHistoryService);
//# sourceMappingURL=product-price-history.service.js.map