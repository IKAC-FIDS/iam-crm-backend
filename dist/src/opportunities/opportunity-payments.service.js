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
exports.OpportunityPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const paymentInclude = {
    commercialDocument: {
        select: {
            id: true,
            type: true,
            status: true,
            number: true,
            title: true,
            amount: true,
            currency: true,
        },
    },
};
let OpportunityPaymentsService = class OpportunityPaymentsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(opportunityId, query, user) {
        await this.getOpportunityForView(opportunityId, user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {
            opportunityId,
        };
        if (query.status) {
            where.status = query.status;
        }
        if (query.commercialDocumentId) {
            where.commercialDocumentId = query.commercialDocumentId;
        }
        if (query.dueFrom || query.dueTo) {
            where.dueDate = {
                ...(query.dueFrom && { gte: new Date(query.dueFrom) }),
                ...(query.dueTo && { lte: new Date(query.dueTo) }),
            };
        }
        const [data, total] = await Promise.all([
            this.prisma.opportunityPayment.findMany({
                where,
                include: paymentInclude,
                orderBy: [{ createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.opportunityPayment.count({ where }),
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
    async findOne(opportunityId, paymentId, user) {
        await this.getOpportunityForView(opportunityId, user);
        const payment = await this.prisma.opportunityPayment.findFirst({
            where: {
                id: paymentId,
                opportunityId,
            },
            include: paymentInclude,
        });
        if (!payment) {
            throw new common_1.NotFoundException('پرداخت پیدا نشد');
        }
        return payment;
    }
    async create(opportunityId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        if (dto.commercialDocumentId) {
            await this.assertDocumentBelongsToOpportunity(opportunity.id, dto.commercialDocumentId);
        }
        const payment = await this.prisma.opportunityPayment.create({
            data: {
                opportunityId: opportunity.id,
                commercialDocumentId: dto.commercialDocumentId,
                status: dto.status ?? client_1.PaymentStatus.PENDING,
                amount: this.toPositiveDecimal(dto.amount, 'amount'),
                currency: dto.currency?.trim().toUpperCase() || 'IRR',
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
                method: dto.method,
                referenceNumber: dto.referenceNumber?.trim() || undefined,
                description: dto.description?.trim() || undefined,
                notes: dto.notes?.trim() || undefined,
                createdById: user.userId,
                updatedById: user.userId,
            },
            include: paymentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-payment',
            entityId: payment.id,
            action: 'opportunity.payment_created',
            after: payment,
            metadata: {
                opportunityId: opportunity.id,
                commercialDocumentId: payment.commercialDocumentId,
            },
        });
        return payment;
    }
    async update(opportunityId, paymentId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityPayment.findFirst({
            where: {
                id: paymentId,
                opportunityId,
            },
            include: paymentInclude,
        });
        if (!current) {
            throw new common_1.NotFoundException('پرداخت پیدا نشد');
        }
        if (dto.commercialDocumentId) {
            await this.assertDocumentBelongsToOpportunity(opportunity.id, dto.commercialDocumentId);
        }
        const data = {
            updatedById: user.userId,
        };
        if (dto.commercialDocumentId !== undefined) {
            data.commercialDocumentId = dto.commercialDocumentId || null;
        }
        if (dto.status !== undefined)
            data.status = dto.status;
        if (dto.amount !== undefined)
            data.amount = this.toPositiveDecimal(dto.amount, 'amount');
        if (dto.currency !== undefined)
            data.currency = dto.currency.trim().toUpperCase() || 'IRR';
        if (dto.dueDate !== undefined)
            data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
        if (dto.paidAt !== undefined)
            data.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;
        if (dto.method !== undefined)
            data.method = dto.method;
        if (dto.referenceNumber !== undefined)
            data.referenceNumber = dto.referenceNumber?.trim() || null;
        if (dto.description !== undefined)
            data.description = dto.description?.trim() || null;
        if (dto.notes !== undefined)
            data.notes = dto.notes?.trim() || null;
        const updated = await this.prisma.opportunityPayment.update({
            where: { id: paymentId },
            data,
            include: paymentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-payment',
            entityId: paymentId,
            action: 'opportunity.payment_updated',
            before: current,
            after: updated,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return updated;
    }
    async markPaid(opportunityId, paymentId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityPayment.findFirst({
            where: {
                id: paymentId,
                opportunityId,
            },
            include: paymentInclude,
        });
        if (!current) {
            throw new common_1.NotFoundException('پرداخت پیدا نشد');
        }
        const updated = await this.prisma.opportunityPayment.update({
            where: { id: paymentId },
            data: {
                status: client_1.PaymentStatus.PAID,
                paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
                method: dto.method ?? current.method,
                referenceNumber: dto.referenceNumber?.trim() || current.referenceNumber,
                notes: dto.notes?.trim() || current.notes,
                updatedById: user.userId,
            },
            include: paymentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-payment',
            entityId: paymentId,
            action: 'opportunity.payment_marked_paid',
            before: {
                status: current.status,
                paidAt: current.paidAt,
            },
            after: {
                status: updated.status,
                paidAt: updated.paidAt,
            },
            metadata: {
                opportunityId: opportunity.id,
                referenceNumber: updated.referenceNumber,
            },
        });
        return updated;
    }
    async cancel(opportunityId, paymentId, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityPayment.findFirst({
            where: {
                id: paymentId,
                opportunityId,
            },
            include: paymentInclude,
        });
        if (!current) {
            throw new common_1.NotFoundException('پرداخت پیدا نشد');
        }
        const updated = await this.prisma.opportunityPayment.update({
            where: { id: paymentId },
            data: {
                status: client_1.PaymentStatus.CANCELLED,
                updatedById: user.userId,
            },
            include: paymentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-payment',
            entityId: paymentId,
            action: 'opportunity.payment_cancelled',
            before: {
                status: current.status,
            },
            after: {
                status: updated.status,
            },
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return updated;
    }
    async remove(opportunityId, paymentId, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityPayment.findFirst({
            where: {
                id: paymentId,
                opportunityId,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('پرداخت پیدا نشد');
        }
        const deleted = await this.prisma.opportunityPayment.delete({
            where: { id: paymentId },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-payment',
            entityId: paymentId,
            action: 'opportunity.payment_deleted',
            before: current,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return deleted;
    }
    async assertDocumentBelongsToOpportunity(opportunityId, commercialDocumentId) {
        const document = await this.prisma.opportunityCommercialDocument.findFirst({
            where: {
                id: commercialDocumentId,
                opportunityId,
            },
        });
        if (!document) {
            throw new common_1.BadRequestException('سند تجاری انتخاب‌شده متعلق به این فرصت فروش نیست');
        }
    }
    toPositiveDecimal(value, fieldName) {
        const decimal = new client_1.Prisma.Decimal(value);
        if (decimal.lessThanOrEqualTo(0)) {
            throw new common_1.BadRequestException(`${fieldName} باید بزرگ‌تر از صفر باشد`);
        }
        return decimal;
    }
    async getOpportunityForView(opportunityId, user) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: {
                AND: [
                    { id: opportunityId },
                    this.opportunityScopeWhere(user),
                ],
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
};
exports.OpportunityPaymentsService = OpportunityPaymentsService;
exports.OpportunityPaymentsService = OpportunityPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], OpportunityPaymentsService);
//# sourceMappingURL=opportunity-payments.service.js.map