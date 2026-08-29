import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FileAttachmentEntityType,
  KnowledgeBaseStatus,
  Prisma,
  TechnicalDocumentStatus,
  TechnicalReleaseStatus,
  TechnicalResourceStatus,
  TechnicalResourceType,
  TenderResult,
  TenderStatus,
  TenderType,
} from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { parseApiDate, parseApiDateRange } from '../common/dates/api-date.util';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDeliverableDto,
  CreateDocumentDto,
  CreateDocumentVersionDto,
  CreateKnowledgeDto,
  CreateReleaseDto,
  CreateRequirementDto,
  CreateResourceDto,
  CreateTenderDto,
  TechnicalListDto,
  TechnicalDocumentListDto,
  TransitionDto,
  UpdateDocumentDto,
  UpdateKnowledgeDto,
  UpdateReleaseDto,
  UpdateRequirementDto,
  UpdateResourceDto,
  UpdateTenderDto,
} from './dto/technical-center.dto';
import {
  assertTransition,
  documentTransitions,
  knowledgeTransitions,
  releaseTransitions,
  tenderTransitions,
} from './technical-lifecycle.policy';

const documentInclude = {
  product: { select: { id: true, name: true, type: true } },
  release: { select: { id: true, version: true, title: true } },
  company: { select: { id: true, legalName: true, brandName: true } },
  opportunity: { select: { id: true, title: true } },
  versions: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.TechnicalDocumentInclude;

const tenderInclude = {
  company: { select: { id: true, legalName: true, brandName: true } },
  opportunity: { select: { id: true, title: true } },
  team: { select: { id: true, code: true, name: true } },
  requirements: { orderBy: { createdAt: 'asc' as const } },
  deliverables: { include: { document: { select: { id: true, title: true, status: true } } } },
} satisfies Prisma.TenderInclude;

@Injectable()
export class TechnicalCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async listReleases(query: TechnicalListDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const where: Prisma.TechnicalReleaseWhereInput = {
      organizationId,
      archivedAt: null,
      ...(query.productId && { productId: query.productId }),
      ...(query.version && { version: query.version }),
      ...(query.status && { status: this.enumValue(TechnicalReleaseStatus, query.status, 'status') }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { version: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(this.range(query) && { releaseDate: this.range(query) }),
    };
    return this.page(query, () => this.prisma.technicalRelease.findMany({
      where,
      include: { product: { select: { id: true, name: true, type: true } } },
      orderBy: this.sort(query, ['updatedAt', 'releaseDate', 'title', 'version'], 'updatedAt'),
      skip: this.skip(query), take: query.limit,
    }), () => this.prisma.technicalRelease.count({ where }));
  }

  async getRelease(id: string, user: CurrentUserPayload) {
    const row = await this.prisma.technicalRelease.findFirst({
      where: { id, organizationId: getCurrentOrganizationId(user) },
      include: { product: true },
    });
    if (!row) throw new NotFoundException('Technical release not found');
    return row;
  }

  async createRelease(dto: CreateReleaseDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    await this.assertProduct(dto.productId);
    await this.assertReleaseVersionAvailable(organizationId, dto.productId, dto.version);
    const row = await this.prisma.technicalRelease.create({ data: {
      organizationId, productId: dto.productId, version: dto.version.trim(), title: dto.title.trim(),
      summary: dto.summary?.trim(), releaseNotes: dto.releaseNotes?.trim(),
      releaseDate: this.date(dto.releaseDate, 'releaseDate'),
      supportStartDate: this.date(dto.supportStartDate, 'supportStartDate'),
      supportEndDate: this.date(dto.supportEndDate, 'supportEndDate'),
      endOfLifeDate: this.date(dto.endOfLifeDate, 'endOfLifeDate'),
      createdById: user.userId, updatedById: user.userId,
    }});
    await this.log('technical-release', row.id, 'technical-release.created', organizationId, user, undefined, row);
    return row;
  }

  async updateRelease(id: string, dto: UpdateReleaseDto, user: CurrentUserPayload) {
    const current = await this.getRelease(id, user);
    this.assertMutable(current.archivedAt);
    if (dto.productId) await this.assertProduct(dto.productId);
    if (dto.productId || dto.version) {
      await this.assertReleaseVersionAvailable(
        current.organizationId,
        dto.productId ?? current.productId,
        dto.version ?? current.version,
        id,
      );
    }
    const { revision, ...input } = dto;
    await this.optimistic('technicalRelease', id, current.organizationId, revision ?? current.revision, {
      ...input,
      version: input.version?.trim(), title: input.title?.trim(), summary: input.summary?.trim(),
      releaseNotes: input.releaseNotes?.trim(),
      releaseDate: this.date(input.releaseDate, 'releaseDate'),
      supportStartDate: this.date(input.supportStartDate, 'supportStartDate'),
      supportEndDate: this.date(input.supportEndDate, 'supportEndDate'),
      endOfLifeDate: this.date(input.endOfLifeDate, 'endOfLifeDate'),
      updatedById: user.userId,
    });
    const row = await this.getRelease(id, user);
    await this.log('technical-release', id, 'technical-release.updated', current.organizationId, user, current, row);
    return row;
  }

  async transitionRelease(id: string, dto: TransitionDto, user: CurrentUserPayload) {
    const current = await this.getRelease(id, user);
    const target = this.enumValue(TechnicalReleaseStatus, dto.status, 'status');
    assertTransition('technical-release', releaseTransitions, current.status, target);
    if (['RELEASED', 'DEPRECATED', 'END_OF_LIFE'].includes(target)) this.require(user, 'technical-release:publish');
    await this.optimistic('technicalRelease', id, current.organizationId, dto.revision ?? current.revision, {
      status: target, updatedById: user.userId,
      ...(target === TechnicalReleaseStatus.RELEASED && !current.releaseDate && { releaseDate: new Date() }),
      ...(target === TechnicalReleaseStatus.ARCHIVED && { archivedAt: new Date() }),
    });
    const row = await this.getRelease(id, user);
    const action = target === 'ARCHIVED' ? 'technical-release.archived' : `technical-release.${target.toLowerCase()}`;
    await this.log('technical-release', id, action, current.organizationId, user, current, row, dto.reason);
    return row;
  }

  async listKnowledge(query: TechnicalListDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const where: Prisma.KnowledgeBaseArticleWhereInput = {
      organizationId, archivedAt: null,
      ...(query.productId && { productId: query.productId }),
      ...(query.releaseId && { releaseId: query.releaseId }),
      ...(query.ownerId && { ownerId: query.ownerId }),
      ...(query.authorId && { authorId: query.authorId }),
      ...(query.category && { category: query.category }),
      ...(query.reviewDue === 'true' && { nextReviewAt: { lte: new Date() } }),
      ...(query.status && { status: this.enumValue(KnowledgeBaseStatus, query.status, 'status') }),
      ...(query.search && { OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ] }),
    };
    return this.page(query, () => this.prisma.knowledgeBaseArticle.findMany({ where, orderBy: this.sort(query, ['updatedAt', 'title', 'nextReviewAt'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.knowledgeBaseArticle.count({ where }));
  }

  async getKnowledge(id: string, user: CurrentUserPayload) {
    const row = await this.prisma.knowledgeBaseArticle.findFirst({ where: { id, organizationId: getCurrentOrganizationId(user) } });
    if (!row) throw new NotFoundException('Knowledge article not found');
    return row;
  }

  async createKnowledge(dto: CreateKnowledgeDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    await this.validateLinks(organizationId, dto);
    const row = await this.prisma.knowledgeBaseArticle.create({ data: {
      ...dto, title: dto.title.trim(), slug: dto.slug.trim().toLowerCase(), content: dto.content.trim(),
      summary: dto.summary?.trim(), category: dto.category?.trim(), nextReviewAt: this.date(dto.nextReviewAt, 'nextReviewAt'),
      organizationId, authorId: user.userId,
    }});
    await this.log('technical-knowledge', row.id, 'technical-knowledge.created', organizationId, user, undefined, row);
    return row;
  }

  async updateKnowledge(id: string, dto: UpdateKnowledgeDto, user: CurrentUserPayload) {
    const current = await this.getKnowledge(id, user);
    this.assertMutable(current.archivedAt);
    const links = dto.productId !== undefined || dto.releaseId !== undefined
      ? { ...dto, productId: dto.productId ?? current.productId, releaseId: dto.releaseId ?? current.releaseId }
      : dto;
    await this.validateLinks(current.organizationId, links);
    const row = await this.prisma.knowledgeBaseArticle.update({ where: { id }, data: {
      ...dto, title: dto.title?.trim(), slug: dto.slug?.trim().toLowerCase(), content: dto.content?.trim(),
      summary: dto.summary?.trim(), category: dto.category?.trim(), nextReviewAt: this.date(dto.nextReviewAt, 'nextReviewAt'),
    }});
    await this.log('technical-knowledge', id, 'technical-knowledge.updated', current.organizationId, user, current, row);
    return row;
  }

  async transitionKnowledge(id: string, dto: TransitionDto, user: CurrentUserPayload) {
    const current = await this.getKnowledge(id, user);
    const target = this.enumValue(KnowledgeBaseStatus, dto.status, 'status');
    assertTransition('technical-knowledge', knowledgeTransitions, current.status, target);
    if (target === KnowledgeBaseStatus.PUBLISHED) this.require(user, 'technical-knowledge:publish');
    const now = new Date();
    const row = await this.prisma.knowledgeBaseArticle.update({ where: { id }, data: {
      status: target,
      ...(target === KnowledgeBaseStatus.PUBLISHED && { publishedAt: now, lastReviewedAt: now }),
      ...(target === KnowledgeBaseStatus.ARCHIVED && { archivedAt: now }),
    }});
    const action = target === 'PUBLISHED' ? 'technical-knowledge.published' : target === 'ARCHIVED' ? 'technical-knowledge.archived' : 'technical-knowledge.transitioned';
    await this.log('technical-knowledge', id, action, current.organizationId, user, current, row, dto.reason);
    return row;
  }

  async listDocuments(query: TechnicalDocumentListDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const where: Prisma.TechnicalDocumentWhereInput = {
      organizationId, archivedAt: null,
      ...(query.productId && { productId: query.productId }), ...(query.releaseId && { releaseId: query.releaseId }),
      ...(query.companyId && { companyId: query.companyId }), ...(query.opportunityId && { opportunityId: query.opportunityId }),
      ...(query.tenderId && { tenderId: query.tenderId }),
      ...(query.ownerId && { ownerId: query.ownerId }), ...(query.type && { documentType: query.type }),
      ...(query.confidentiality && { confidentiality: query.confidentiality }),
      ...(query.status && { status: this.enumValue(TechnicalDocumentStatus, query.status, 'status') }),
      ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }),
    };
    return this.page(query, () => this.prisma.technicalDocument.findMany({ where, include: documentInclude, orderBy: this.sort(query, ['updatedAt', 'title', 'effectiveFrom', 'expiresAt'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.technicalDocument.count({ where }));
  }

  async getDocument(id: string, user: CurrentUserPayload) {
    const row = await this.prisma.technicalDocument.findFirst({ where: { id, organizationId: getCurrentOrganizationId(user) }, include: documentInclude });
    if (!row) throw new NotFoundException('Technical document not found');
    return row;
  }

  async createDocument(dto: CreateDocumentDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    await this.validateLinks(organizationId, dto);
    const row = await this.prisma.technicalDocument.create({ data: {
      ...dto, title: dto.title.trim(), documentType: dto.documentType.trim(), description: dto.description?.trim(),
      effectiveFrom: this.date(dto.effectiveFrom, 'effectiveFrom'), expiresAt: this.date(dto.expiresAt, 'expiresAt'),
      organizationId, createdById: user.userId, updatedById: user.userId,
    }, include: documentInclude });
    await this.log('technical-document', row.id, 'technical-document.created', organizationId, user, undefined, row);
    return row;
  }

  async updateDocument(id: string, dto: UpdateDocumentDto, user: CurrentUserPayload) {
    const current = await this.getDocument(id, user);
    this.assertMutable(current.archivedAt);
    const links = dto.productId !== undefined || dto.releaseId !== undefined
      ? { ...dto, productId: dto.productId ?? current.productId, releaseId: dto.releaseId ?? current.releaseId }
      : dto;
    await this.validateLinks(current.organizationId, links);
    const { revision, ...input } = dto;
    await this.optimistic('technicalDocument', id, current.organizationId, revision ?? current.revision, {
      ...input, title: input.title?.trim(), documentType: input.documentType?.trim(), description: input.description?.trim(),
      effectiveFrom: this.date(input.effectiveFrom, 'effectiveFrom'), expiresAt: this.date(input.expiresAt, 'expiresAt'), updatedById: user.userId,
    });
    const row = await this.getDocument(id, user);
    await this.log('technical-document', id, 'technical-document.updated', current.organizationId, user, current, row);
    return row;
  }

  async transitionDocument(id: string, dto: TransitionDto, user: CurrentUserPayload) {
    const current = await this.getDocument(id, user);
    const target = this.enumValue(TechnicalDocumentStatus, dto.status, 'status');
    assertTransition('technical-document', documentTransitions, current.status, target);
    if (['APPROVED', 'ACTIVE', 'SUPERSEDED'].includes(target)) this.require(user, 'technical-document:approve');
    await this.optimistic('technicalDocument', id, current.organizationId, dto.revision ?? current.revision, {
      status: target, updatedById: user.userId,
      ...(target === TechnicalDocumentStatus.ACTIVE && !current.effectiveFrom && { effectiveFrom: new Date() }),
      ...(target === TechnicalDocumentStatus.ARCHIVED && { archivedAt: new Date() }),
    });
    if (target === TechnicalDocumentStatus.APPROVED) {
      const latest = await this.prisma.technicalDocumentVersion.findFirst({
        where: { organizationId: current.organizationId, documentId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, approvedAt: true },
      });
      if (latest && !latest.approvedAt) {
        await this.prisma.technicalDocumentVersion.update({
          where: { id: latest.id },
          data: { approvedById: user.userId, approvedAt: new Date(), approvalNote: dto.reason?.trim() },
        });
      }
    }
    const row = await this.getDocument(id, user);
    const action = ['APPROVED', 'ACTIVE', 'SUPERSEDED', 'ARCHIVED'].includes(target)
      ? `technical-document.${target.toLowerCase()}`
      : 'technical-document.transitioned';
    await this.log('technical-document', id, action, current.organizationId, user, current, row, dto.reason);
    return row;
  }

  async addDocumentVersion(documentId: string, dto: CreateDocumentVersionDto, user: CurrentUserPayload) {
    const document = await this.getDocument(documentId, user);
    this.assertMutable(document.archivedAt);
    if (dto.attachmentId) await this.assertAttachment(document.organizationId, dto.attachmentId, FileAttachmentEntityType.TECHNICAL_DOCUMENT, documentId);
    const row = await this.prisma.technicalDocumentVersion.create({ data: {
      organizationId: document.organizationId, documentId, version: dto.version.trim(), attachmentId: dto.attachmentId,
      contentHash: dto.contentHash?.trim(), createdById: user.userId,
    }});
    await this.log('technical-document-version', row.id, 'technical-document.version-created', document.organizationId, user, undefined, row);
    return row;
  }

  async listDocumentVersions(documentId: string, user: CurrentUserPayload) {
    const document = await this.getDocument(documentId, user);
    return this.prisma.technicalDocumentVersion.findMany({
      where: { organizationId: document.organizationId, documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentVersion(documentId: string, versionId: string, user: CurrentUserPayload) {
    const document = await this.getDocument(documentId, user);
    const row = await this.prisma.technicalDocumentVersion.findFirst({
      where: { id: versionId, organizationId: document.organizationId, documentId },
    });
    if (!row) throw new NotFoundException('Technical document version not found');
    return row;
  }

  async listResources(query: TechnicalListDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const where: Prisma.TechnicalResourceWhereInput = {
      organizationId, archivedAt: null,
      ...(query.productId && { productId: query.productId }), ...(query.releaseId && { releaseId: query.releaseId }),
      ...(query.ownerId && { ownerId: query.ownerId }),
      ...(query.status && { status: this.enumValue(TechnicalResourceStatus, query.status, 'status') }),
      ...(query.type && { resourceType: this.enumValue(TechnicalResourceType, query.type, 'type') }),
      ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }),
    };
    return this.page(query, () => this.prisma.technicalResource.findMany({ where, orderBy: this.sort(query, ['updatedAt', 'title', 'version'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.technicalResource.count({ where }));
  }

  async getResource(id: string, user: CurrentUserPayload) {
    const row = await this.prisma.technicalResource.findFirst({ where: { id, organizationId: getCurrentOrganizationId(user) } });
    if (!row) throw new NotFoundException('Technical resource not found');
    return row;
  }

  async createResource(dto: CreateResourceDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    await this.validateLinks(organizationId, dto);
    const row = await this.prisma.technicalResource.create({ data: {
      ...dto, title: dto.title.trim(), description: dto.description?.trim(), version: dto.version?.trim(), checksum: dto.checksum?.trim(),
      organizationId, createdById: user.userId, updatedById: user.userId,
    }});
    await this.log('technical-resource', row.id, 'technical-resource.created', organizationId, user, undefined, row);
    return row;
  }

  async updateResource(id: string, dto: UpdateResourceDto, user: CurrentUserPayload) {
    const current = await this.getResource(id, user);
    this.assertMutable(current.archivedAt);
    const links = dto.productId !== undefined || dto.releaseId !== undefined
      ? { ...dto, productId: dto.productId ?? current.productId, releaseId: dto.releaseId ?? current.releaseId }
      : dto;
    await this.validateLinks(current.organizationId, links);
    if (dto.attachmentId) await this.assertAttachment(current.organizationId, dto.attachmentId, FileAttachmentEntityType.TECHNICAL_RESOURCE, id);
    const row = await this.prisma.technicalResource.update({ where: { id }, data: {
      ...dto, title: dto.title?.trim(), description: dto.description?.trim(), version: dto.version?.trim(), checksum: dto.checksum?.trim(),
      updatedById: user.userId, ...(dto.status === 'ARCHIVED' && { archivedAt: new Date() }),
    }});
    const action = dto.status === 'DEPRECATED' ? 'technical-resource.deprecated' : dto.status === 'ARCHIVED' ? 'technical-resource.archived' : 'technical-resource.updated';
    await this.log('technical-resource', id, action, current.organizationId, user, current, row);
    return row;
  }

  async listTenders(query: TechnicalListDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const where: Prisma.TenderWhereInput = {
      organizationId, archivedAt: null,
      ...(query.companyId && { companyId: query.companyId }), ...(query.opportunityId && { opportunityId: query.opportunityId }),
      ...(query.ownerId && { ownerId: query.ownerId }), ...(query.teamId && { teamId: query.teamId }),
      ...(query.status && { status: this.enumValue(TenderStatus, query.status, 'status') }),
      ...(query.type && { tenderType: this.enumValue(TenderType, query.type, 'type') }),
      ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { referenceNumber: { contains: query.search, mode: 'insensitive' } }] }),
      ...(this.range(query) && { submissionDeadline: this.range(query) }),
    };
    return this.page(query, () => this.prisma.tender.findMany({ where, include: tenderInclude, orderBy: this.sort(query, ['updatedAt', 'title', 'submissionDeadline', 'estimatedValue'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.tender.count({ where }));
  }

  async getTender(id: string, user: CurrentUserPayload) {
    const row = await this.prisma.tender.findFirst({ where: { id, organizationId: getCurrentOrganizationId(user) }, include: tenderInclude });
    if (!row) throw new NotFoundException('Technical tender not found');
    return row;
  }

  async createTender(dto: CreateTenderDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    await this.validateLinks(organizationId, dto);
    const row = await this.prisma.tender.create({ data: {
      ...dto, title: dto.title.trim(), referenceNumber: dto.referenceNumber?.trim(), description: dto.description?.trim(), source: dto.source?.trim(),
      submissionDeadline: this.date(dto.submissionDeadline, 'submissionDeadline'), technicalDeadline: this.date(dto.technicalDeadline, 'technicalDeadline'),
      expectedDecisionDate: this.date(dto.expectedDecisionDate, 'expectedDecisionDate'),
      estimatedValue: dto.estimatedValue === undefined ? undefined : new Prisma.Decimal(dto.estimatedValue), currency: dto.currency?.toUpperCase(),
      organizationId, createdById: user.userId, updatedById: user.userId,
    }, include: tenderInclude });
    await this.log('technical-tender', row.id, 'technical-tender.created', organizationId, user, undefined, row);
    return row;
  }

  async updateTender(id: string, dto: UpdateTenderDto, user: CurrentUserPayload) {
    const current = await this.getTender(id, user);
    this.assertMutable(current.archivedAt);
    await this.validateLinks(current.organizationId, dto);
    const { revision, ...input } = dto;
    await this.optimistic('tender', id, current.organizationId, revision ?? current.revision, {
      ...input, title: input.title?.trim(), referenceNumber: input.referenceNumber?.trim(), description: input.description?.trim(), source: input.source?.trim(),
      submissionDeadline: this.date(input.submissionDeadline, 'submissionDeadline'), technicalDeadline: this.date(input.technicalDeadline, 'technicalDeadline'),
      expectedDecisionDate: this.date(input.expectedDecisionDate, 'expectedDecisionDate'),
      estimatedValue: input.estimatedValue === undefined ? undefined : new Prisma.Decimal(input.estimatedValue), currency: input.currency?.toUpperCase(), updatedById: user.userId,
    });
    const row = await this.getTender(id, user);
    await this.log('technical-tender', id, 'technical-tender.updated', current.organizationId, user, current, row);
    return row;
  }

  async transitionTender(id: string, dto: TransitionDto, user: CurrentUserPayload) {
    const current = await this.getTender(id, user);
    const target = this.enumValue(TenderStatus, dto.status, 'status');
    assertTransition('technical-tender', tenderTransitions, current.status, target);
    if (target === TenderStatus.SUBMITTED) this.require(user, 'technical-tender:submit');
    if (['WON', 'LOST', 'CANCELLED', 'ARCHIVED'].includes(target)) this.require(user, 'technical-tender:close');
    const result = target === TenderStatus.WON ? TenderResult.WON : target === TenderStatus.LOST ? TenderResult.LOST : target === TenderStatus.CANCELLED ? TenderResult.CANCELLED : undefined;
    await this.optimistic('tender', id, current.organizationId, dto.revision ?? current.revision, {
      status: target, updatedById: user.userId, ...(result && { result, resultReason: dto.reason?.trim() }),
      ...(target === TenderStatus.ARCHIVED && { archivedAt: new Date() }),
    });
    const row = await this.getTender(id, user);
    const named = ['SUBMITTED', 'WON', 'LOST', 'CANCELLED', 'ARCHIVED'].includes(target);
    await this.log('technical-tender', id, named ? `technical-tender.${target.toLowerCase()}` : 'technical-tender.transitioned', current.organizationId, user, current, row, dto.reason);
    return row;
  }

  async addRequirement(tenderId: string, dto: CreateRequirementDto, user: CurrentUserPayload) {
    const tender = await this.getTender(tenderId, user);
    this.assertTenderOpen(tender.status);
    if (dto.ownerId) await this.assertUser(tender.organizationId, dto.ownerId);
    const row = await this.prisma.tenderRequirement.create({ data: {
      ...dto, title: dto.title.trim(), category: dto.category?.trim(), description: dto.description?.trim(), response: dto.response?.trim(),
      dueDate: this.date(dto.dueDate, 'dueDate'), organizationId: tender.organizationId, tenderId,
    }});
    await this.log('tender-requirement', row.id, 'technical-tender.requirement-created', tender.organizationId, user, undefined, row);
    return row;
  }

  async listRequirements(tenderId: string, user: CurrentUserPayload) {
    const tender = await this.getTender(tenderId, user);
    return this.prisma.tenderRequirement.findMany({
      where: { organizationId: tender.organizationId, tenderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRequirement(tenderId: string, requirementId: string, dto: UpdateRequirementDto, user: CurrentUserPayload) {
    const tender = await this.getTender(tenderId, user);
    this.assertTenderOpen(tender.status);
    const current = await this.prisma.tenderRequirement.findFirst({ where: { id: requirementId, tenderId, organizationId: tender.organizationId } });
    if (!current) throw new NotFoundException('Tender requirement not found');
    if (dto.ownerId) await this.assertUser(tender.organizationId, dto.ownerId);
    const row = await this.prisma.tenderRequirement.update({ where: { id: requirementId }, data: {
      ...dto, title: dto.title?.trim(), category: dto.category?.trim(), description: dto.description?.trim(), response: dto.response?.trim(), dueDate: this.date(dto.dueDate, 'dueDate'),
    }});
    const action = dto.status && dto.status !== current.status ? 'technical-tender.requirement-status-changed' : 'technical-tender.requirement-updated';
    await this.log('tender-requirement', row.id, action, tender.organizationId, user, current, row);
    return row;
  }

  async removeRequirement(tenderId: string, requirementId: string, user: CurrentUserPayload) {
    const tender = await this.getTender(tenderId, user);
    this.assertTenderOpen(tender.status);
    const current = await this.prisma.tenderRequirement.findFirst({ where: { id: requirementId, tenderId, organizationId: tender.organizationId } });
    if (!current) throw new NotFoundException('Tender requirement not found');
    await this.prisma.tenderRequirement.delete({ where: { id: requirementId } });
    await this.log('tender-requirement', requirementId, 'technical-tender.requirement-deleted', tender.organizationId, user, current);
    return { id: requirementId, deleted: true };
  }

  async addDeliverable(tenderId: string, dto: CreateDeliverableDto, user: CurrentUserPayload) {
    const tender = await this.getTender(tenderId, user);
    this.assertTenderOpen(tender.status);
    const document = await this.prisma.technicalDocument.findFirst({ where: { id: dto.documentId, organizationId: tender.organizationId, archivedAt: null } });
    if (!document) throw new NotFoundException('Technical document not found');
    const row = await this.prisma.tenderDeliverable.create({ data: { organizationId: tender.organizationId, tenderId, documentId: dto.documentId, label: dto.label?.trim() } });
    await this.log('tender-deliverable', row.id, 'technical-tender.deliverable-created', tender.organizationId, user, undefined, row);
    return row;
  }

  async removeDeliverable(tenderId: string, deliverableId: string, user: CurrentUserPayload) {
    const tender = await this.getTender(tenderId, user);
    this.assertTenderOpen(tender.status);
    const current = await this.prisma.tenderDeliverable.findFirst({ where: { id: deliverableId, tenderId, organizationId: tender.organizationId } });
    if (!current) throw new NotFoundException('Tender deliverable not found');
    await this.prisma.tenderDeliverable.delete({ where: { id: deliverableId } });
    await this.log('tender-deliverable', deliverableId, 'technical-tender.deliverable-deleted', tender.organizationId, user, current);
    return { id: deliverableId, deleted: true };
  }

  private async validateLinks<T extends object>(organizationId: string, input: T) {
    const dto = input as Record<string, unknown>;
    if (typeof dto.productId === 'string') await this.assertProduct(dto.productId);
    if (typeof dto.releaseId === 'string') {
      const release = await this.prisma.technicalRelease.findFirst({ where: { id: dto.releaseId, organizationId, archivedAt: null } });
      if (!release) throw new NotFoundException('Technical release not found');
      if (dto.productId && release.productId !== dto.productId) throw new BadRequestException('Release does not belong to the selected product');
    }
    if (typeof dto.companyId === 'string') await this.assertScoped('company', organizationId, dto.companyId);
    if (typeof dto.opportunityId === 'string') await this.assertScoped('opportunity', organizationId, dto.opportunityId);
    if (typeof dto.teamId === 'string') await this.assertScoped('team', organizationId, dto.teamId);
    for (const key of ['ownerId', 'reviewerId', 'technicalLeadId', 'commercialLeadId']) {
      if (typeof dto[key] === 'string') await this.assertUser(organizationId, dto[key] as string);
    }
    if (typeof dto.tenderId === 'string') await this.assertScoped('tender', organizationId, dto.tenderId);
  }

  private async assertProduct(id: string) {
    if (!await this.prisma.productCatalogItem.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('Product not found');
  }

  private async assertReleaseVersionAvailable(organizationId: string, productId: string, version: string, excludeId?: string) {
    const duplicate = await this.prisma.technicalRelease.findFirst({
      where: { organizationId, productId, version: version.trim(), ...(excludeId && { id: { not: excludeId } }) },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException({
      code: 'DUPLICATE_RELEASE_VERSION',
      message: 'This product already has a release with the same version in this tenant',
    });
  }

  private async assertScoped(model: 'company' | 'opportunity' | 'team' | 'tender', organizationId: string, id: string) {
    const row = await (this.prisma[model] as any).findFirst({ where: { id, organizationId }, select: { id: true } });
    if (!row) throw new NotFoundException(`${model} not found`);
  }

  private async assertUser(organizationId: string, userId: string) {
    const row = await this.prisma.organizationMembership.findFirst({ where: { organizationId, userId, status: 'ACTIVE' }, select: { id: true } });
    if (!row) throw new NotFoundException('Tenant user not found');
  }

  private async assertAttachment(organizationId: string, id: string, entityType: FileAttachmentEntityType, entityId: string) {
    const row = await this.prisma.fileAttachment.findFirst({ where: { id, organizationId, entityType, entityId, deletedAt: null }, select: { id: true } });
    if (!row) throw new BadRequestException('Attachment is not linked to this technical entity');
  }

  private async optimistic(model: 'technicalRelease' | 'technicalDocument' | 'tender', id: string, organizationId: string, revision: number, data: Record<string, unknown>) {
    const result = await (this.prisma[model] as any).updateMany({ where: { id, organizationId, revision }, data: { ...data, revision: { increment: 1 } } });
    if (result.count !== 1) throw new ConflictException({ code: 'REVISION_CONFLICT', message: 'The record was changed by another request' });
  }

  private require(user: CurrentUserPayload, permission: string) {
    if (!user.tenantContext?.permissions.includes(permission)) throw new ForbiddenException(`Permission required: ${permission}`);
  }

  private assertMutable(archivedAt: Date | null) {
    if (archivedAt) throw new BadRequestException('Archived records cannot be changed');
  }

  private assertTenderOpen(status: TenderStatus) {
    const closed: TenderStatus[] = [TenderStatus.WON, TenderStatus.LOST, TenderStatus.CANCELLED, TenderStatus.ARCHIVED];
    if (closed.includes(status)) throw new BadRequestException('Closed tenders cannot be changed');
  }

  private enumValue<T extends string>(values: Record<string, T>, value: string, field: string): T {
    if (!Object.values(values).includes(value as T)) throw new BadRequestException(`${field} is invalid`);
    return value as T;
  }

  private date(value: string | undefined, field: string) { return value === undefined ? undefined : parseApiDate(value, field); }
  private range(query: TechnicalListDto) { return parseApiDateRange(query.from, query.to, 'from', 'to'); }
  private skip(query: TechnicalListDto) { return ((query.page ?? 1) - 1) * (query.limit ?? 20); }
  private sort(query: TechnicalListDto, allowed: string[], fallback: string) {
    const field = query.sort ?? fallback;
    if (!allowed.includes(field)) throw new BadRequestException(`sort must be one of: ${allowed.join(', ')}`);
    return { [field]: query.sortDirection ?? 'desc' };
  }
  private async page<T>(query: TechnicalListDto, rows: () => Promise<T[]>, count: () => Promise<number>) {
    const [data, total] = await Promise.all([rows(), count()]);
    const page = query.page ?? 1, limit = query.limit ?? 20, totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
  }

  private log(entityType: string, entityId: string, action: string, organizationId: string, user: CurrentUserPayload, before?: unknown, after?: unknown, reason?: string) {
    return this.audit.recordTenantEvent({
      actorId: user.userId,
      actorMembershipId: user.membershipId,
      organizationId,
      entityType,
      entityId,
      action,
      before: this.auditSnapshot(before),
      after: this.auditSnapshot(after),
      metadata: reason ? { reason } : undefined,
    });
  }

  private auditSnapshot(value: unknown) {
    if (!value || typeof value !== 'object') return value;
    const row = value as Record<string, unknown>;
    const keys = ['id', 'organizationId', 'productId', 'releaseId', 'documentId', 'tenderId', 'companyId', 'opportunityId', 'ownerId', 'title', 'slug', 'version', 'status', 'resourceType', 'tenderType', 'result', 'revision', 'archivedAt', 'updatedAt'];
    return Object.fromEntries(keys.filter((key) => row[key] !== undefined).map((key) => [key, row[key]]));
  }
}
