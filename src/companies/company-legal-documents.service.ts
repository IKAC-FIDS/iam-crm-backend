import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FileAttachmentEntityType, Prisma, UserRole } from '@prisma/client';
import { AttachmentsService } from '../attachments/attachments.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { parseApiDate } from '../common/dates/api-date.util';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { userTeamScopeWhere } from '../common/tenant/team-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyLegalDocumentDto, UploadCompanyLegalDocumentDto } from './dto/company-legal-document.dto';

@Injectable()
export class CompanyLegalDocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly attachments: AttachmentsService) {}

  async findAll(companyId: string, user: CurrentUserPayload) {
    await this.assertCompany(companyId, user);
    return this.prisma.companyLegalDocument.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async upload(companyId: string, dto: UploadCompanyLegalDocumentDto, file: Express.Multer.File | undefined, user: CurrentUserPayload) {
    await this.assertCompany(companyId, user);
    if (!file) throw new BadRequestException('Legal document file is required');
    const title = dto.title?.trim();
    if (!title) throw new BadRequestException('Document title is required');

    const document = await this.prisma.companyLegalDocument.create({ data: {
      companyId, type: dto.type, title, description: dto.description?.trim() || undefined,
      documentDate: dto.documentDate ? parseApiDate(dto.documentDate, 'documentDate') : undefined,
      createdById: user.userId,
    } });
    try {
      const attachment = await this.attachments.upload({ entityType: FileAttachmentEntityType.COMPANY_LEGAL_DOCUMENT, entityId: document.id, description: dto.description }, file, user);
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
    } catch (error) {
      await this.prisma.companyLegalDocument.delete({ where: { id: document.id } });
      throw error;
    }
  }

  async update(companyId: string, documentId: string, dto: UpdateCompanyLegalDocumentDto, user: CurrentUserPayload) {
    await this.assertCompany(companyId, user);
    const current = await this.getDocument(companyId, documentId);
    const data: Prisma.CompanyLegalDocumentUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.documentDate !== undefined) data.documentDate = dto.documentDate ? parseApiDate(dto.documentDate, 'documentDate') : null;
    if (dto.title !== undefined && !data.title) throw new BadRequestException('Document title is required');
    return this.prisma.companyLegalDocument.update({ where: { id: current.id }, data });
  }

  async remove(companyId: string, documentId: string, user: CurrentUserPayload) {
    await this.assertCompany(companyId, user);
    const current = await this.getDocument(companyId, documentId);
    if (current.attachmentId) await this.attachments.remove(current.attachmentId, user);
    return this.prisma.companyLegalDocument.delete({ where: { id: current.id } });
  }

  private async getDocument(companyId: string, id: string) {
    const document = await this.prisma.companyLegalDocument.findFirst({ where: { id, companyId } });
    if (!document) throw new NotFoundException('Company legal document not found');
    return document;
  }

  private async assertCompany(companyId: string, user: CurrentUserPayload) {
    const company = await this.prisma.company.findFirst({ where: {
      id: companyId,
      organizationId: getCurrentOrganizationId(user),
      ...(user.role === UserRole.REP ? { ownerId: user.userId } : {}),
      ...(user.role === UserRole.MANAGER ? { owner: userTeamScopeWhere(user) } : {}),
    } });
    if (!company) throw new NotFoundException('Company not found');
  }
}
