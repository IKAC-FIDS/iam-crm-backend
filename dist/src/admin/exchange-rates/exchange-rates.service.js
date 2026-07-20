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
exports.ExchangeRatesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const api_date_util_1 = require("../../common/dates/api-date.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const product_pricing_service_1 = require("../../product-catalog/product-pricing.service");
const product_price_history_service_1 = require("../../product-catalog/product-price-history.service");
const include = {
    createdBy: { select: { id: true, fullName: true, email: true } },
};
let ExchangeRatesService = class ExchangeRatesService {
    constructor(prisma, pricing, audit, history) {
        this.prisma = prisma;
        this.pricing = pricing;
        this.audit = audit;
        this.history = history;
    }
    async current() {
        const rate = await this.prisma.currencyExchangeRate.findFirst({
            where: {
                baseCurrency: "USD",
                quoteCurrency: "IRR",
                validFrom: { lte: new Date() },
                validTo: null,
            },
            include,
            orderBy: { validFrom: "desc" },
        });
        return rate ? this.withStatus(rate) : null;
    }
    async findAll(query) {
        const page = query.page ?? 1, limit = query.limit ?? 20;
        const where = { baseCurrency: "USD", quoteCurrency: "IRR" };
        const [data, total] = await Promise.all([
            this.prisma.currencyExchangeRate.findMany({
                where,
                include,
                orderBy: { validFrom: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.currencyExchangeRate.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: data.map((v) => this.withStatus(v)),
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
    async create(dto, user) {
        const rate = new client_1.Prisma.Decimal(dto.rate);
        if (rate.lessThanOrEqualTo(0))
            throw new common_1.BadRequestException("Exchange rate must be greater than zero");
        const effectiveFrom = dto.effectiveFrom
            ? (0, api_date_util_1.parseApiDate)(dto.effectiveFrom, "effectiveFrom")
            : new Date();
        if (effectiveFrom > new Date())
            throw new common_1.BadRequestException("effectiveFrom cannot be in the future");
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw(client_1.Prisma.sql `
        SELECT CAST(
          pg_advisory_xact_lock(89241377)
          AS TEXT
        ) AS "lockResult"
      `);
            const active = await tx.currencyExchangeRate.findFirst({
                where: { baseCurrency: "USD", quoteCurrency: "IRR", validTo: null },
                orderBy: { validFrom: "desc" },
            });
            if (active && effectiveFrom <= active.validFrom)
                throw new common_1.BadRequestException("effectiveFrom must be after the active rate validFrom");
            const overlap = await tx.currencyExchangeRate.findFirst({
                where: {
                    baseCurrency: "USD",
                    quoteCurrency: "IRR",
                    validFrom: { lt: effectiveFrom },
                    OR: [{ validTo: null }, { validTo: { gt: effectiveFrom } }],
                },
            });
            if (overlap && overlap.id !== active?.id)
                throw new common_1.BadRequestException("Exchange-rate periods cannot overlap");
            if (active)
                await tx.currencyExchangeRate.update({
                    where: { id: active.id },
                    data: { validTo: effectiveFrom },
                });
            const created = await tx.currencyExchangeRate.create({
                data: {
                    rate,
                    validFrom: effectiveFrom,
                    createdById: user.userId,
                    note: dto.note?.trim() || undefined,
                },
                include,
            });
            const products = await tx.productCatalogItem.findMany({
                where: { pricingCurrency: client_1.PricingCurrency.USD },
                select: {
                    id: true,
                    pricingCurrency: true,
                    inPersonInputPrice: true,
                    digikalaInputPrice: true,
                    inPersonProfitPercent: true,
                    digikalaProfitPercent: true,
                },
            });
            const historyAt = new Date();
            for (const product of products) {
                const prices = this.pricing.calculateUsd(product, created.id, rate, historyAt);
                const updated = await tx.productCatalogItem.update({
                    where: { id: product.id },
                    data: {
                        ...prices,
                        defaultUnitPrice: prices.inPersonPriceIrr,
                        currency: "IRR",
                    },
                });
                await this.history.append(tx, product.id, updated, client_1.ProductPriceHistoryReason.EXCHANGE_RATE_CHANGED, historyAt, user.userId, dto.note);
            }
            return {
                created,
                previous: active,
                recalculatedProductCount: products.length,
            };
        }, { timeout: 60000 });
        await this.audit.record({
            actorId: user.userId,
            entityType: "currency-exchange-rate",
            entityId: result.created.id,
            action: "exchange_rate.created",
            before: result.previous,
            after: result.created,
            metadata: {
                effectiveFrom,
                recalculatedProductCount: result.recalculatedProductCount,
            },
        });
        return {
            rate: this.withStatus(result.created),
            recalculatedProductCount: result.recalculatedProductCount,
        };
    }
    withStatus(rate) {
        const now = new Date();
        return {
            ...rate,
            status: rate.validFrom <= now && rate.validTo === null
                ? "ACTIVE"
                : "HISTORICAL",
        };
    }
};
exports.ExchangeRatesService = ExchangeRatesService;
exports.ExchangeRatesService = ExchangeRatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        product_pricing_service_1.ProductPricingService,
        audit_log_service_1.AuditLogService,
        product_price_history_service_1.ProductPriceHistoryService])
], ExchangeRatesService);
//# sourceMappingURL=exchange-rates.service.js.map