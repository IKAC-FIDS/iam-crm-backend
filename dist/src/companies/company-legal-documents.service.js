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
var CompanyLegalDocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyLegalDocumentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const attachments_service_1 = require("../attachments/attachments.service");
const api_date_util_1 = require("../common/dates/api-date.util");
const prisma_service_1 = require("../prisma/prisma.service");
const company_access_service_1 = require("./company-access.service");
let CompanyLegalDocumentsService = CompanyLegalDocumentsService_1 = class CompanyLegalDocumentsService {
    constructor(prisma, attachments, companyAccess) {
        this.prisma = prisma;
        this.attachments = attachments;
        this.companyAccess = companyAccess;
        this.logger = new common_1.Logger(CompanyLegalDocumentsService_1.name);
    }
    async findAll(companyId, user) {
        await this.assertCompany(companyId, user);
        return this.prisma.companyLegalDocument.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
    }
    async upload(companyId, dto, file, user, requestId = null) {
        await this.assertCompany(companyId, user);
        if (!file)
            throw new common_1.BadRequestException('Legal document file is required');
        const title = dto.title?.trim();
        if (!title)
            throw new common_1.BadRequestException('Document title is required');
        const document = await this.prisma.companyLegalDocument.create({ data: {
                companyId, type: dto.type, title, description: dto.description?.trim() || undefined,
                documentDate: dto.documentDate ? (0, api_date_util_1.parseApiDate)(dto.documentDate, 'documentDate') : undefined,
                createdById: user.userId,
            } });
        let attachment;
        try {
            attachment = await this.attachments.upload({ entityType: client_1.FileAttachmentEntityType.COMPANY_LEGAL_DOCUMENT, entityId: document.id, description: dto.description }, file, user);
            const updated = await this.prisma.companyLegalDocument.update({ where: { id: document.id }, data: { attachmentId: attachment.id } });
            return {
                ...updated,
                attachment: {
                    id: attachment.id,
                    originalFileName: attachment.originalFileName,
                    mimeType: attachment.mimeType,
                    sizeBytes: attachment.sizeBytes,
                    createdAt: attachment.createdAt,
                },
            };
        }
        catch (error) {
            this.logger.error(`Legal document upload failed companyId=${companyId} documentId=${document.id} requestId=${requestId ?? 'none'}`, error instanceof Error ? error.stack : String(error));
            if (attachment) {
                try {
                    await this.attachments.remove(attachment.id, user);
                }
                catch (cleanupError) {
                    this.logger.error(`Legal document attachment cleanup failed attachmentId=${attachment.id} requestId=${requestId ?? 'none'}`, cleanupError instanceof Error ? cleanupError.stack : String(cleanupError));
                }
            }
            await this.prisma.companyLegalDocument.deleteMany({ where: { id: document.id } });
            throw error;
        }
    }
    async update(companyId, documentId, dto, user) {
        await this.assertCompany(companyId, user);
        const current = await this.getDocument(companyId, documentId);
        const data = {};
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.title !== undefined)
            data.title = dto.title.trim();
        if (dto.description !== undefined)
            data.description = dto.description.trim() || null;
        if (dto.documentDate !== undefined)
            data.documentDate = dto.documentDate ? (0, api_date_util_1.parseApiDate)(dto.documentDate, 'documentDate') : null;
        if (dto.title !== undefined && !data.title)
            throw new common_1.BadRequestException('Document title is required');
        return this.prisma.companyLegalDocument.update({ where: { id: current.id }, data });
    }
    async remove(companyId, documentId, user) {
        await this.assertCompany(companyId, user);
        const current = await this.getDocument(companyId, documentId);
        if (current.attachmentId)
            await this.attachments.remove(current.attachmentId, user);
        return this.prisma.companyLegalDocument.delete({ where: { id: current.id } });
    }
    async getDocument(companyId, id) {
        const document = await this.prisma.companyLegalDocument.findFirst({ where: { id, companyId } });
        if (!document)
            throw new common_1.NotFoundException('Company legal document not found');
        return document;
    }
    async assertCompany(companyId, user) {
        await this.companyAccess.assertCompanyMutable(companyId, user);
    }
};
exports.CompanyLegalDocumentsService = CompanyLegalDocumentsService;
exports.CompanyLegalDocumentsService = CompanyLegalDocumentsService = CompanyLegalDocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, attachments_service_1.AttachmentsService, company_access_service_1.CompanyAccessService])
], CompanyLegalDocumentsService);
//# sourceMappingURL=company-legal-documents.service.js.map