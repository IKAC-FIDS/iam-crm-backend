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
exports.OpportunityLineItemsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const lineItemInclude = {
    product: {
        select: {
            id: true,
            code: true,
            name: true,
            category: true,
            unit: true,
            defaultUnitPrice: true,
            currency: true,
            isActive: true,
        },
    },
};
let OpportunityLineItemsService = class OpportunityLineItemsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(opportunityId, user) {
        await this.getOpportunityForView(opportunityId, user);
        return this.prisma.opportunityLineItem.findMany({
            where: { opportunityId },
            include: lineItemInclude,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async findOne(opportunityId, lineItemId, user) {
        await this.getOpportunityForView(opportunityId, user);
        const item = await this.prisma.opportunityLineItem.findFirst({
            where: {
                id: lineItemId,
                opportunityId,
            },
            include: lineItemInclude,
        });
        if (!item) {
            throw new common_1.NotFoundException('آیتم فرصت فروش پیدا نشد');
        }
        return item;
    }
    async create(opportunityId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const product = await this.getActiveProduct(dto.productId);
        const quantity = this.toPositiveDecimal(dto.quantity, 'quantity');
        const unitPrice = dto.unitPrice !== undefined
            ? this.toNonNegativeDecimal(dto.unitPrice, 'unitPrice')
            : new client_1.Prisma.Decimal(product.defaultUnitPrice);
        const discountAmount = this.toNonNegativeDecimal(dto.discountAmount ?? 0, 'discountAmount');
        const taxAmount = this.toNonNegativeDecimal(dto.taxAmount ?? 0, 'taxAmount');
        const lineTotal = this.calculateLineTotal(quantity, unitPrice, discountAmount, taxAmount);
        const item = await this.prisma.opportunityLineItem.create({
            data: {
                opportunityId: opportunity.id,
                productId: product.id,
                productCodeSnapshot: product.code,
                productNameSnapshot: product.name,
                description: dto.description?.trim() || undefined,
                quantity,
                unitPrice,
                discountAmount,
                taxAmount,
                lineTotal,
                sortOrder: dto.sortOrder ?? 0,
            },
            include: lineItemInclude,
        });
        await this.recalculateOpportunityEstimatedValue(opportunity.id);
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-line-item',
            entityId: item.id,
            action: 'opportunity.line_item_created',
            after: item,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return item;
    }
    async update(opportunityId, lineItemId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityLineItem.findFirst({
            where: {
                id: lineItemId,
                opportunityId,
            },
            include: lineItemInclude,
        });
        if (!current) {
            throw new common_1.NotFoundException('آیتم فرصت فروش پیدا نشد');
        }
        let productId = current.productId;
        let productCodeSnapshot = current.productCodeSnapshot;
        let productNameSnapshot = current.productNameSnapshot;
        if (dto.productId !== undefined) {
            const product = await this.getActiveProduct(dto.productId);
            productId = product.id;
            productCodeSnapshot = product.code;
            productNameSnapshot = product.name;
        }
        const quantity = dto.quantity !== undefined
            ? this.toPositiveDecimal(dto.quantity, 'quantity')
            : new client_1.Prisma.Decimal(current.quantity);
        const unitPrice = dto.unitPrice !== undefined
            ? this.toNonNegativeDecimal(dto.unitPrice, 'unitPrice')
            : new client_1.Prisma.Decimal(current.unitPrice);
        const discountAmount = dto.discountAmount !== undefined
            ? this.toNonNegativeDecimal(dto.discountAmount, 'discountAmount')
            : new client_1.Prisma.Decimal(current.discountAmount);
        const taxAmount = dto.taxAmount !== undefined
            ? this.toNonNegativeDecimal(dto.taxAmount, 'taxAmount')
            : new client_1.Prisma.Decimal(current.taxAmount);
        const lineTotal = this.calculateLineTotal(quantity, unitPrice, discountAmount, taxAmount);
        const data = {
            productId,
            productCodeSnapshot,
            productNameSnapshot,
            quantity,
            unitPrice,
            discountAmount,
            taxAmount,
            lineTotal,
        };
        if (dto.description !== undefined) {
            data.description = dto.description?.trim() || null;
        }
        if (dto.sortOrder !== undefined) {
            data.sortOrder = dto.sortOrder;
        }
        const updated = await this.prisma.opportunityLineItem.update({
            where: { id: lineItemId },
            data,
            include: lineItemInclude,
        });
        await this.recalculateOpportunityEstimatedValue(opportunity.id);
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-line-item',
            entityId: lineItemId,
            action: 'opportunity.line_item_updated',
            before: current,
            after: updated,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return updated;
    }
    async remove(opportunityId, lineItemId, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityLineItem.findFirst({
            where: {
                id: lineItemId,
                opportunityId,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('آیتم فرصت فروش پیدا نشد');
        }
        const deleted = await this.prisma.opportunityLineItem.delete({
            where: { id: lineItemId },
        });
        await this.recalculateOpportunityEstimatedValue(opportunity.id);
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-line-item',
            entityId: lineItemId,
            action: 'opportunity.line_item_deleted',
            before: current,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return deleted;
    }
    async getOpportunityForView(opportunityId, user) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: {
                AND: [
                    { id: opportunityId },
                    this.opportunityScopeWhere(user),
                ],
            },
            include: {
                company: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                team: true,
                            },
                        },
                    },
                },
            },
        });
        if (!opportunity) {
            throw new common_1.NotFoundException('Opportunity not found');
        }
        return opportunity;
    }
    async getOpportunityForMutation(opportunityId, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Opportunity is read-only for this role');
        }
        const opportunity = await this.getOpportunityForView(opportunityId, user);
        if (opportunity.archivedAt) {
            throw new common_1.BadRequestException('Archived opportunities cannot be changed');
        }
        return opportunity;
    }
    opportunityScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
            return user.team
                ? { company: { owner: { team: user.team } } }
                : { id: { in: [] } };
        }
        return {
            OR: [
                { ownerId: user.userId },
                { company: { ownerId: user.userId } },
            ],
        };
    }
    async getActiveProduct(productId) {
        const product = await this.prisma.productCatalogItem.findUnique({
            where: { id: productId },
        });
        if (!product || !product.isActive) {
            throw new common_1.BadRequestException('محصول یا سرویس انتخاب‌شده معتبر یا فعال نیست');
        }
        return product;
    }
    toPositiveDecimal(value, fieldName) {
        const decimal = new client_1.Prisma.Decimal(value);
        if (decimal.lessThanOrEqualTo(0)) {
            throw new common_1.BadRequestException(`${fieldName} باید بزرگ‌تر از صفر باشد`);
        }
        return decimal;
    }
    toNonNegativeDecimal(value, fieldName) {
        const decimal = new client_1.Prisma.Decimal(value);
        if (decimal.lessThan(0)) {
            throw new common_1.BadRequestException(`${fieldName} نمی‌تواند منفی باشد`);
        }
        return decimal;
    }
    calculateLineTotal(quantity, unitPrice, discountAmount, taxAmount) {
        const lineTotal = quantity.mul(unitPrice).minus(discountAmount).plus(taxAmount);
        if (lineTotal.lessThan(0)) {
            throw new common_1.BadRequestException('مبلغ نهایی آیتم نمی‌تواند منفی باشد');
        }
        return lineTotal;
    }
    async recalculateOpportunityEstimatedValue(opportunityId) {
        const aggregate = await this.prisma.opportunityLineItem.aggregate({
            where: { opportunityId },
            _count: { _all: true },
            _sum: { lineTotal: true },
        });
        await this.prisma.opportunity.update({
            where: { id: opportunityId },
            data: {
                estimatedValue: aggregate._count._all > 0
                    ? aggregate._sum.lineTotal ?? new client_1.Prisma.Decimal(0)
                    : null,
            },
        });
    }
};
exports.OpportunityLineItemsService = OpportunityLineItemsService;
exports.OpportunityLineItemsService = OpportunityLineItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], OpportunityLineItemsService);
//# sourceMappingURL=opportunity-line-items.service.js.map