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
let ProductCatalogService = class ProductCatalogService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {};
        if (query.active !== undefined) {
            where.isActive = query.active === 'true';
        }
        if (query.category?.trim()) {
            where.category = {
                equals: query.category.trim(),
                mode: 'insensitive',
            };
        }
        if (query.search?.trim()) {
            const search = query.search.trim();
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.productCatalogItem.findMany({
                where,
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
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
        });
        if (!item) {
            throw new common_1.NotFoundException('محصول یا سرویس پیدا نشد');
        }
        return item;
    }
    async create(dto, user) {
        const code = this.normalizeCode(dto.code);
        const existing = await this.prisma.productCatalogItem.findUnique({
            where: { code },
        });
        if (existing) {
            throw new common_1.ConflictException('کد محصول یا سرویس قبلاً ثبت شده است');
        }
        const item = await this.prisma.productCatalogItem.create({
            data: {
                code,
                name: dto.name.trim(),
                description: dto.description?.trim() || undefined,
                category: dto.category?.trim() || undefined,
                unit: dto.unit?.trim() || undefined,
                defaultUnitPrice: new client_1.Prisma.Decimal(dto.defaultUnitPrice),
                currency: dto.currency?.trim().toUpperCase() || 'IRR',
                isActive: dto.isActive ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'product-catalog-item',
            entityId: item.id,
            action: 'product.created',
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
                throw new common_1.ConflictException('کد محصول یا سرویس قبلاً ثبت شده است');
            }
            data.code = code;
        }
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name) {
                throw new common_1.BadRequestException('نام محصول یا سرویس الزامی است');
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
        if (dto.defaultUnitPrice !== undefined) {
            data.defaultUnitPrice = new client_1.Prisma.Decimal(dto.defaultUnitPrice);
        }
        if (dto.currency !== undefined) {
            data.currency = dto.currency.trim().toUpperCase() || 'IRR';
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        if (dto.sortOrder !== undefined) {
            data.sortOrder = dto.sortOrder;
        }
        const updated = await this.prisma.productCatalogItem.update({
            where: { id },
            data,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'product-catalog-item',
            entityId: id,
            action: 'product.updated',
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
            entityType: 'product-catalog-item',
            entityId: id,
            action: 'product.activated',
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
            entityType: 'product-catalog-item',
            entityId: id,
            action: 'product.deactivated',
            before: current,
            after: updated,
        });
        return updated;
    }
    normalizeCode(code) {
        const normalized = code.trim().toUpperCase();
        if (!normalized) {
            throw new common_1.BadRequestException('کد محصول یا سرویس الزامی است');
        }
        return normalized;
    }
};
exports.ProductCatalogService = ProductCatalogService;
exports.ProductCatalogService = ProductCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], ProductCatalogService);
//# sourceMappingURL=product-catalog.service.js.map