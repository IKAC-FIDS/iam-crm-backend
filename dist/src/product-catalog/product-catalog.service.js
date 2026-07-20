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
exports.ProductCatalogService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const product_pricing_service_1 = require("./product-pricing.service");
const product_price_history_service_1 = require("./product-price-history.service");
const productInclude = {
    calculatedExchangeRate: {
        select: { id: true, rate: true, validFrom: true, validTo: true },
    },
};
let ProductCatalogService = class ProductCatalogService {
    constructor(prisma, audit, pricing, history) {
        this.prisma = prisma;
        this.audit = audit;
        this.pricing = pricing;
        this.history = history;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {};
        if (query.active !== undefined) {
            where.isActive = query.active === "true";
        }
        if (query.category?.trim()) {
            where.category = {
                equals: query.category.trim(),
                mode: "insensitive",
            };
        }
        if (query.search?.trim()) {
            const search = query.search.trim();
            where.OR = [
                { code: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.productCatalogItem.findMany({
                where,
                include: productInclude,
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.productCatalogItem.count({ where }),
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
    async findOne(id) {
        const item = await this.prisma.productCatalogItem.findUnique({
            where: { id },
            include: productInclude,
        });
        if (!item) {
            throw new common_1.NotFoundException("محصول یا سرویس پیدا نشد");
        }
        return item;
    }
    async create(dto, user) {
        const code = this.normalizeCode(dto.code);
        const existing = await this.prisma.productCatalogItem.findUnique({
            where: { code },
        });
        if (existing) {
            throw new common_1.ConflictException("کد محصول یا سرویس قبلاً ثبت شده است");
        }
        const compatibilityPrice = dto.inPersonInputPrice ?? dto.defaultUnitPrice ?? "0";
        const prices = await this.pricing.calculate({
            pricingCurrency: dto.pricingCurrency ?? client_1.PricingCurrency.IRR,
            inPersonInputPrice: compatibilityPrice,
            digikalaInputPrice: dto.digikalaInputPrice ?? compatibilityPrice,
            inPersonProfitPercent: dto.inPersonProfitPercent,
            digikalaProfitPercent: dto.digikalaProfitPercent,
        });
        const item = await this.prisma.$transaction(async (tx) => {
            const createdAt = new Date();
            const created = await tx.productCatalogItem.create({
                data: {
                    code,
                    name: dto.name.trim(),
                    description: dto.description?.trim() || undefined,
                    category: dto.category?.trim() || undefined,
                    unit: dto.unit?.trim() || undefined,
                    ...prices,
                    defaultUnitPrice: prices.inPersonPriceIrr,
                    currency: "IRR",
                    isActive: dto.isActive ?? true,
                    sortOrder: dto.sortOrder ?? 0,
                },
                include: productInclude,
            });
            await this.history.append(tx, created.id, created, client_1.ProductPriceHistoryReason.PRODUCT_CREATED, createdAt, user.userId);
            return created;
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: "product-catalog-item",
            entityId: item.id,
            action: "product.created",
            after: item,
        });
        return item;
    }
    async update(id, dto, user) {
        const current = await this.findOne(id);
        const data = {};
        if (dto.code !== undefined) {
            const code = this.normalizeCode(dto.code);
            const duplicate = await this.prisma.productCatalogItem.findFirst({
                where: {
                    code,
                    NOT: { id },
                },
            });
            if (duplicate) {
                throw new common_1.ConflictException("کد محصول یا سرویس قبلاً ثبت شده است");
            }
            data.code = code;
        }
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name) {
                throw new common_1.BadRequestException("نام محصول یا سرویس الزامی است");
            }
            data.name = name;
        }
        if (dto.description !== undefined) {
            data.description = dto.description?.trim() || null;
        }
        if (dto.category !== undefined) {
            data.category = dto.category?.trim() || null;
        }
        if (dto.unit !== undefined) {
            data.unit = dto.unit?.trim() || null;
        }
        const pricingChanged = dto.pricingCurrency !== undefined ||
            dto.inPersonInputPrice !== undefined ||
            dto.digikalaInputPrice !== undefined ||
            dto.inPersonProfitPercent !== undefined ||
            dto.digikalaProfitPercent !== undefined ||
            dto.defaultUnitPrice !== undefined;
        if (pricingChanged) {
            const nextCurrency = dto.pricingCurrency ?? current.pricingCurrency;
            const compatibilityPrice = dto.defaultUnitPrice;
            const prices = await this.pricing.calculate({
                pricingCurrency: nextCurrency,
                inPersonInputPrice: dto.inPersonInputPrice ??
                    compatibilityPrice ??
                    current.inPersonInputPrice,
                digikalaInputPrice: dto.digikalaInputPrice ??
                    compatibilityPrice ??
                    current.digikalaInputPrice,
                inPersonProfitPercent: dto.inPersonProfitPercent !== undefined
                    ? dto.inPersonProfitPercent
                    : nextCurrency === client_1.PricingCurrency.IRR
                        ? null
                        : current.inPersonProfitPercent,
                digikalaProfitPercent: dto.digikalaProfitPercent !== undefined
                    ? dto.digikalaProfitPercent
                    : nextCurrency === client_1.PricingCurrency.IRR
                        ? null
                        : current.digikalaProfitPercent,
            });
            Object.assign(data, prices, {
                defaultUnitPrice: prices.inPersonPriceIrr,
                currency: "IRR",
            });
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        if (dto.sortOrder !== undefined) {
            data.sortOrder = dto.sortOrder;
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw(client_1.Prisma.sql `
        SELECT CAST(pg_advisory_xact_lock(hashtext(${id})) AS TEXT) AS "lockResult"
      `);
            const locked = await tx.productCatalogItem.findUnique({
                where: { id },
                include: productInclude,
            });
            if (!locked)
                throw new common_1.NotFoundException("Product not found");
            const next = await tx.productCatalogItem.update({
                where: { id },
                data,
                include: productInclude,
            });
            if (pricingChanged && this.pricingDiffers(locked, next)) {
                await this.history.append(tx, id, next, client_1.ProductPriceHistoryReason.PRODUCT_UPDATED, new Date(), user.userId);
            }
            return next;
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: "product-catalog-item",
            entityId: id,
            action: "product.updated",
            before: current,
            after: updated,
        });
        return updated;
    }
    async activate(id, user) {
        const current = await this.findOne(id);
        const updated = await this.prisma.productCatalogItem.update({
            where: { id },
            data: { isActive: true },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: "product-catalog-item",
            entityId: id,
            action: "product.activated",
            before: current,
            after: updated,
        });
        return updated;
    }
    async deactivate(id, user) {
        const current = await this.findOne(id);
        const updated = await this.prisma.productCatalogItem.update({
            where: { id },
            data: { isActive: false },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: "product-catalog-item",
            entityId: id,
            action: "product.deactivated",
            before: current,
            after: updated,
        });
        return updated;
    }
    normalizeCode(code) {
        const normalized = code.trim().toUpperCase();
        if (!normalized) {
            throw new common_1.BadRequestException("کد محصول یا سرویس الزامی است");
        }
        return normalized;
    }
    pricingDiffers(a, b) {
        const fields = [
            "pricingCurrency",
            "inPersonInputPrice",
            "digikalaInputPrice",
            "inPersonProfitPercent",
            "digikalaProfitPercent",
            "inPersonPriceIrr",
            "digikalaPriceIrr",
            "calculatedExchangeRateId",
        ];
        return fields.some((field) => {
            const left = a[field], right = b[field];
            if (left == null || right == null)
                return left !== right;
            return left instanceof client_1.Prisma.Decimal || right instanceof client_1.Prisma.Decimal
                ? !new client_1.Prisma.Decimal(left).equals(right)
                : left !== right;
        });
    }
};
exports.ProductCatalogService = ProductCatalogService;
exports.ProductCatalogService = ProductCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        product_pricing_service_1.ProductPricingService,
        product_price_history_service_1.ProductPriceHistoryService])
], ProductCatalogService);
//# sourceMappingURL=product-catalog.service.js.map