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
exports.OpportunityCommercialDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const commercialDocumentInclude = {
    payments: {
        select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            dueDate: true,
            paidAt: true,
            method: true,
            referenceNumber: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    },
};
let OpportunityCommercialDocumentsService = class OpportunityCommercialDocumentsService {
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
        if (query.type) {
            where.type = query.type;
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.search?.trim()) {
            const search = query.search.trim();
            where.OR = [
                { number: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { externalRef: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.opportunityCommercialDocument.findMany({
                where,
                include: commercialDocumentInclude,
                orderBy: [{ createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.opportunityCommercialDocument.count({ where }),
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
    async findOne(opportunityId, documentId, user) {
        await this.getOpportunityForView(opportunityId, user);
        const document = await this.prisma.opportunityCommercialDocument.findFirst({
            where: {
                id: documentId,
                opportunityId,
            },
            include: commercialDocumentInclude,
        });
        if (!document) {
            throw new common_1.NotFoundException('سند تجاری پیدا نشد');
        }
        return document;
    }
    async create(opportunityId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const status = dto.status ?? client_1.CommercialDocumentStatus.DRAFT;
        const statusDates = this.buildStatusDates(status, dto);
        const document = await this.prisma.opportunityCommercialDocument.create({
            data: {
                opportunityId: opportunity.id,
                type: dto.type,
                status,
                number: dto.number?.trim() || undefined,
                version: dto.version ?? 1,
                title: dto.title.trim(),
                description: dto.description?.trim() || undefined,
                amount: dto.amount !== undefined
                    ? new client_1.Prisma.Decimal(dto.amount)
                    : opportunity.estimatedValue ?? undefined,
                currency: dto.currency?.trim().toUpperCase() || 'IRR',
                validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
                issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
                sentAt: statusDates.sentAt,
                acceptedAt: statusDates.acceptedAt,
                rejectedAt: statusDates.rejectedAt,
                signedAt: statusDates.signedAt,
                fileUrl: dto.fileUrl?.trim() || undefined,
                externalRef: dto.externalRef?.trim() || undefined,
                notes: dto.notes?.trim() || undefined,
                createdById: user.userId,
                updatedById: user.userId,
            },
            include: commercialDocumentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-commercial-document',
            entityId: document.id,
            action: 'opportunity.document_created',
            after: document,
            metadata: {
                opportunityId: opportunity.id,
                type: document.type,
            },
        });
        return document;
    }
    async update(opportunityId, documentId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityCommercialDocument.findFirst({
            where: {
                id: documentId,
                opportunityId,
            },
            include: commercialDocumentInclude,
        });
        if (!current) {
            throw new common_1.NotFoundException('سند تجاری پیدا نشد');
        }
        const data = {
            updatedById: user.userId,
        };
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.status !== undefined)
            data.status = dto.status;
        if (dto.number !== undefined)
            data.number = dto.number?.trim() || null;
        if (dto.version !== undefined)
            data.version = dto.version;
        if (dto.title !== undefined) {
            const title = dto.title.trim();
            if (!title) {
                throw new common_1.BadRequestException('عنوان سند الزامی است');
            }
            data.title = title;
        }
        if (dto.description !== undefined) {
            data.description = dto.description?.trim() || null;
        }
        if (dto.amount !== undefined) {
            data.amount = new client_1.Prisma.Decimal(dto.amount);
        }
        if (dto.currency !== undefined) {
            data.currency = dto.currency.trim().toUpperCase() || 'IRR';
        }
        if (dto.validUntil !== undefined) {
            data.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
        }
        if (dto.issuedAt !== undefined) {
            data.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : null;
        }
        if (dto.sentAt !== undefined) {
            data.sentAt = dto.sentAt ? new Date(dto.sentAt) : null;
        }
        if (dto.acceptedAt !== undefined) {
            data.acceptedAt = dto.acceptedAt ? new Date(dto.acceptedAt) : null;
        }
        if (dto.rejectedAt !== undefined) {
            data.rejectedAt = dto.rejectedAt ? new Date(dto.rejectedAt) : null;
        }
        if (dto.signedAt !== undefined) {
            data.signedAt = dto.signedAt ? new Date(dto.signedAt) : null;
        }
        if (dto.fileUrl !== undefined) {
            data.fileUrl = dto.fileUrl?.trim() || null;
        }
        if (dto.externalRef !== undefined) {
            data.externalRef = dto.externalRef?.trim() || null;
        }
        if (dto.notes !== undefined) {
            data.notes = dto.notes?.trim() || null;
        }
        const updated = await this.prisma.opportunityCommercialDocument.update({
            where: { id: documentId },
            data,
            include: commercialDocumentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-commercial-document',
            entityId: documentId,
            action: 'opportunity.document_updated',
            before: current,
            after: updated,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return updated;
    }
    async changeStatus(opportunityId, documentId, dto, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityCommercialDocument.findFirst({
            where: {
                id: documentId,
                opportunityId,
            },
            include: commercialDocumentInclude,
        });
        if (!current) {
            throw new common_1.NotFoundException('سند تجاری پیدا نشد');
        }
        const now = new Date();
        const data = {
            status: dto.status,
            updatedById: user.userId,
            ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
        };
        if (dto.status === client_1.CommercialDocumentStatus.SENT)
            data.sentAt = now;
        if (dto.status === client_1.CommercialDocumentStatus.ACCEPTED)
            data.acceptedAt = now;
        if (dto.status === client_1.CommercialDocumentStatus.REJECTED)
            data.rejectedAt = now;
        if (dto.status === client_1.CommercialDocumentStatus.SIGNED)
            data.signedAt = now;
        const updated = await this.prisma.opportunityCommercialDocument.update({
            where: { id: documentId },
            data,
            include: commercialDocumentInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-commercial-document',
            entityId: documentId,
            action: 'opportunity.document_status_changed',
            before: {
                status: current.status,
            },
            after: {
                status: updated.status,
            },
            metadata: {
                opportunityId: opportunity.id,
                notes: dto.notes,
            },
        });
        return updated;
    }
    async remove(opportunityId, documentId, user) {
        const opportunity = await this.getOpportunityForMutation(opportunityId, user);
        const current = await this.prisma.opportunityCommercialDocument.findFirst({
            where: {
                id: documentId,
                opportunityId,
            },
        });
        if (!current) {
            throw new common_1.NotFoundException('سند تجاری پیدا نشد');
        }
        const deleted = await this.prisma.opportunityCommercialDocument.delete({
            where: { id: documentId },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'opportunity-commercial-document',
            entityId: documentId,
            action: 'opportunity.document_deleted',
            before: current,
            metadata: {
                opportunityId: opportunity.id,
            },
        });
        return deleted;
    }
    buildStatusDates(status, dto) {
        const now = new Date();
        return {
            sentAt: dto.sentAt
                ? new Date(dto.sentAt)
                : status === client_1.CommercialDocumentStatus.SENT
                    ? now
                    : undefined,
            acceptedAt: dto.acceptedAt
                ? new Date(dto.acceptedAt)
                : status === client_1.CommercialDocumentStatus.ACCEPTED
                    ? now
                    : undefined,
            rejectedAt: dto.rejectedAt
                ? new Date(dto.rejectedAt)
                : status === client_1.CommercialDocumentStatus.REJECTED
                    ? now
                    : undefined,
            signedAt: dto.signedAt
                ? new Date(dto.signedAt)
                : status === client_1.CommercialDocumentStatus.SIGNED
                    ? now
                    : undefined,
        };
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
exports.OpportunityCommercialDocumentsService = OpportunityCommercialDocumentsService;
exports.OpportunityCommercialDocumentsService = OpportunityCommercialDocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], OpportunityCommercialDocumentsService);
//# sourceMappingURL=opportunity-commercial-documents.service.js.map