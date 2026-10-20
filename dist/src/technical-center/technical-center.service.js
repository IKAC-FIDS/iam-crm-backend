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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalCenterService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const api_date_util_1 = require("../common/dates/api-date.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const tasks_service_1 = require("../tasks/tasks.service");
const technical_lifecycle_policy_1 = require("./technical-lifecycle.policy");
const documentVersionInclude = {
    attachment: { select: { id: true, name: true, originalFileName: true, mimeType: true, sizeBytes: true, sha256: true, createdAt: true, deletedAt: true } },
    createdBy: { select: { id: true, fullName: true, email: true } },
    approvedBy: { select: { id: true, fullName: true, email: true } },
};
const documentRelations = {
    product: { select: { id: true, name: true, type: true } },
    release: { select: { id: true, version: true, title: true } },
    company: { select: { id: true, legalName: true, brandName: true } },
    opportunity: { select: { id: true, title: true } },
    owner: { select: { id: true, fullName: true, email: true } },
};
const documentInclude = {
    ...documentRelations,
    versions: { include: documentVersionInclude, orderBy: { createdAt: 'desc' } },
};
const documentListInclude = {
    ...documentRelations,
    versions: { include: documentVersionInclude, orderBy: { createdAt: 'desc' }, take: 1 },
};
const releaseDetailInclude = {
    product: { select: { id: true, name: true, type: true } },
    createdBy: { select: { id: true, fullName: true, email: true } },
    updatedBy: { select: { id: true, fullName: true, email: true } },
    _count: { select: { knowledgeArticles: true, technicalDocuments: true, technicalResources: true } },
};
const knowledgeRelations = {
    product: { select: { id: true, name: true, type: true } },
    release: { select: { id: true, version: true, title: true } },
    owner: { select: { id: true, fullName: true, email: true } },
    author: { select: { id: true, fullName: true, email: true } },
    reviewer: { select: { id: true, fullName: true, email: true } },
};
const resourceRelations = {
    product: { select: { id: true, name: true, type: true } },
    release: { select: { id: true, version: true, title: true } },
    owner: { select: { id: true, fullName: true, email: true } },
    attachment: { select: { id: true, name: true, originalFileName: true, mimeType: true, sizeBytes: true, sha256: true, deletedAt: true } },
};
const tenderInclude = {
    company: { select: { id: true, legalName: true, brandName: true } },
    opportunity: { select: { id: true, title: true } },
    team: { select: { id: true, code: true, name: true } },
    owner: { select: { id: true, fullName: true, email: true } },
    technicalLead: { select: { id: true, fullName: true, email: true } },
    commercialLead: { select: { id: true, fullName: true, email: true } },
    requirements: { include: {
            owner: { select: { id: true, fullName: true, email: true } },
            task: { select: { id: true, title: true, status: true, assignedToId: true } },
            dependencies: { include: { dependsOnRequirement: { select: { id: true, title: true, referenceId: true, status: true } } } },
        }, orderBy: { createdAt: 'asc' } },
    deliverables: { include: { document: { select: { id: true, title: true, status: true, versions: { select: { id: true, attachmentId: true }, take: 1, orderBy: { createdAt: 'desc' } } } } } },
    reviews: {
        include: {
            reviewer: { select: { id: true, fullName: true, email: true } },
            requestedBy: { select: { id: true, fullName: true, email: true } },
            decidedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    },
};
let TechnicalCenterService = class TechnicalCenterService {
    constructor(prisma, audit, notifications, tasks) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
        this.tasks = tasks;
    }
    async listReleases(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const where = {
            organizationId,
            archivedAt: null,
            ...(query.productId && { productId: query.productId }),
            ...(query.version && { version: { contains: query.version.trim(), mode: 'insensitive' } }),
            ...(query.status && { status: this.enumValue(client_1.TechnicalReleaseStatus, query.status, 'status') }),
            ...(query.search && {
                OR: [
                    { title: { contains: query.search, mode: 'insensitive' } },
                    { version: { contains: query.search, mode: 'insensitive' } },
                    { summary: { contains: query.search, mode: 'insensitive' } },
                    { product: { name: { contains: query.search, mode: 'insensitive' } } },
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
    async getRelease(id, user) {
        const row = await this.prisma.technicalRelease.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            include: releaseDetailInclude,
        });
        if (!row)
            throw new common_1.NotFoundException('Technical release not found');
        return row;
    }
    async createRelease(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.assertProduct(dto.productId);
        await this.assertReleaseVersionAvailable(organizationId, dto.productId, dto.version);
        const schedule = this.releaseSchedule(dto);
        const row = await this.prisma.technicalRelease.create({ data: {
                organizationId, productId: dto.productId, version: dto.version.trim(), title: dto.title.trim(),
                summary: dto.summary?.trim(), releaseNotes: dto.releaseNotes?.trim(),
                ...schedule,
                createdById: user.userId, updatedById: user.userId,
            }, include: releaseDetailInclude });
        await this.log('technical-release', row.id, 'technical-release.created', organizationId, user, undefined, row);
        return row;
    }
    async updateRelease(id, dto, user) {
        const current = await this.getRelease(id, user);
        this.assertMutable(current.archivedAt);
        if ((current.status === client_1.TechnicalReleaseStatus.RELEASED ||
            current.status === client_1.TechnicalReleaseStatus.DEPRECATED ||
            current.status === client_1.TechnicalReleaseStatus.END_OF_LIFE) &&
            ((dto.productId !== undefined && dto.productId !== current.productId) ||
                (dto.version !== undefined && dto.version.trim() !== current.version))) {
            throw new common_1.BadRequestException({
                code: 'RELEASE_IDENTITY_LOCKED',
                message: 'پس از انتشار، محصول و شماره نسخه قابل تغییر نیستند.',
            });
        }
        if (dto.productId)
            await this.assertProduct(dto.productId);
        if (dto.productId || dto.version) {
            await this.assertReleaseVersionAvailable(current.organizationId, dto.productId ?? current.productId, dto.version ?? current.version, id);
        }
        const { revision, ...input } = dto;
        const schedule = this.releaseSchedule(dto, current);
        await this.optimistic('technicalRelease', id, current.organizationId, revision ?? current.revision, {
            ...input,
            version: input.version?.trim(), title: input.title?.trim(), summary: input.summary?.trim(),
            releaseNotes: input.releaseNotes?.trim(),
            ...(input.releaseDate !== undefined && { releaseDate: schedule.releaseDate }),
            ...(input.supportStartDate !== undefined && { supportStartDate: schedule.supportStartDate }),
            ...(input.supportEndDate !== undefined && { supportEndDate: schedule.supportEndDate }),
            ...(input.endOfLifeDate !== undefined && { endOfLifeDate: schedule.endOfLifeDate }),
            updatedById: user.userId,
        });
        const row = await this.getRelease(id, user);
        await this.log('technical-release', id, 'technical-release.updated', current.organizationId, user, current, row);
        return row;
    }
    async transitionRelease(id, dto, user) {
        const current = await this.getRelease(id, user);
        const target = this.enumValue(client_1.TechnicalReleaseStatus, dto.status, 'status');
        (0, technical_lifecycle_policy_1.assertTransition)('technical-release', technical_lifecycle_policy_1.releaseTransitions, current.status, target);
        if (['RELEASED', 'DEPRECATED', 'END_OF_LIFE'].includes(target))
            this.require(user, 'technical-release:publish');
        if ((target === client_1.TechnicalReleaseStatus.PLANNED ||
            target === client_1.TechnicalReleaseStatus.RELEASED) &&
            !current.releaseDate) {
            throw new common_1.BadRequestException({
                code: 'RELEASE_DATE_REQUIRED',
                message: 'برای برنامه‌ریزی یا انتشار نسخه، تاریخ انتشار را مشخص کنید.',
            });
        }
        if (target === client_1.TechnicalReleaseStatus.RELEASED &&
            current.releaseDate &&
            current.releaseDate.getTime() > Date.now()) {
            throw new common_1.BadRequestException({
                code: 'RELEASE_DATE_IN_FUTURE',
                message: 'تا پیش از رسیدن تاریخ برنامه‌ریزی‌شده، امکان ثبت وضعیت منتشرشده وجود ندارد.',
            });
        }
        if ((target === client_1.TechnicalReleaseStatus.DEPRECATED ||
            target === client_1.TechnicalReleaseStatus.END_OF_LIFE ||
            target === client_1.TechnicalReleaseStatus.ARCHIVED) &&
            !dto.reason?.trim()) {
            throw new common_1.BadRequestException({
                code: 'RELEASE_TRANSITION_REASON_REQUIRED',
                message: 'ثبت دلیل برای این تغییر وضعیت الزامی است.',
            });
        }
        await this.optimistic('technicalRelease', id, current.organizationId, dto.revision ?? current.revision, {
            status: target, updatedById: user.userId,
            ...(target === client_1.TechnicalReleaseStatus.RELEASED && !current.releaseDate && { releaseDate: new Date() }),
            ...(target === client_1.TechnicalReleaseStatus.ARCHIVED && { archivedAt: new Date() }),
        });
        const row = await this.getRelease(id, user);
        const action = target === 'ARCHIVED' ? 'technical-release.archived' : `technical-release.${target.toLowerCase()}`;
        await this.log('technical-release', id, action, current.organizationId, user, current, row, dto.reason);
        return row;
    }
    async listKnowledge(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const now = new Date();
        const where = {
            organizationId, archivedAt: null,
            ...(query.productId && { productId: query.productId }),
            ...(query.releaseId && { releaseId: query.releaseId }),
            ...(query.ownerId && { ownerId: query.ownerId }),
            ...(query.authorId && { authorId: query.authorId }),
            ...(query.category && { category: { contains: query.category.trim(), mode: 'insensitive' } }),
            ...(query.visibility && { visibility: query.visibility }),
            ...(query.reviewDue === 'true' && { nextReviewAt: { lte: now } }),
            ...(query.reviewDue === 'false' && { AND: [{ OR: [{ nextReviewAt: null }, { nextReviewAt: { gt: now } }] }] }),
            ...(query.status && { status: this.enumValue(client_1.KnowledgeBaseStatus, query.status, 'status') }),
            ...(query.search && { OR: [
                    { title: { contains: query.search, mode: 'insensitive' } },
                    { slug: { contains: query.search, mode: 'insensitive' } },
                    { summary: { contains: query.search, mode: 'insensitive' } },
                    { content: { contains: query.search, mode: 'insensitive' } },
                    { category: { contains: query.search, mode: 'insensitive' } },
                    { product: { name: { contains: query.search, mode: 'insensitive' } } },
                    { release: { title: { contains: query.search, mode: 'insensitive' } } },
                ] }),
        };
        return this.page(query, () => this.prisma.knowledgeBaseArticle.findMany({ where, include: knowledgeRelations, orderBy: this.sort(query, ['updatedAt', 'title', 'nextReviewAt', 'publishedAt'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.knowledgeBaseArticle.count({ where }));
    }
    async listKnowledgeCategories(search, user) {
        const rows = await this.prisma.knowledgeBaseArticle.findMany({
            where: {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                archivedAt: null,
                category: {
                    not: null,
                    ...(search?.trim() && { contains: search.trim(), mode: 'insensitive' }),
                },
            },
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' },
            take: 50,
        });
        return rows
            .map((row) => row.category?.trim())
            .filter((category) => Boolean(category))
            .map((category) => ({ id: category, label: category }));
    }
    async getKnowledge(id, user) {
        const row = await this.prisma.knowledgeBaseArticle.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            include: knowledgeRelations,
        });
        if (!row)
            throw new common_1.NotFoundException('Knowledge article not found');
        return row;
    }
    async createKnowledge(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const contentSource = this.normalizeKnowledgeContent(dto);
        await this.validateLinks(organizationId, dto);
        await this.assertKnowledgeSlugAvailable(organizationId, dto.slug);
        const row = await this.prisma.knowledgeBaseArticle.create({ data: {
                ...dto, ...contentSource, title: dto.title.trim(), slug: dto.slug.trim().toLowerCase(),
                summary: this.nullableTrim(dto.summary), category: this.nullableTrim(dto.category), nextReviewAt: this.nullableDate(dto.nextReviewAt, 'nextReviewAt'),
                organizationId, authorId: user.userId,
            }, include: knowledgeRelations });
        await this.log('technical-knowledge', row.id, 'technical-knowledge.created', organizationId, user, undefined, row);
        return row;
    }
    async updateKnowledge(id, dto, user) {
        const current = await this.getKnowledge(id, user);
        this.assertMutable(current.archivedAt);
        if (current.status === client_1.KnowledgeBaseStatus.PUBLISHED) {
            throw new common_1.BadRequestException({
                code: 'PUBLISHED_KNOWLEDGE_LOCKED',
                message: 'برای ویرایش مقاله منتشرشده، ابتدا آن را به وضعیت بازبینی برگردانید.',
            });
        }
        const links = dto.productId !== undefined || dto.releaseId !== undefined
            ? {
                ...dto,
                productId: dto.productId !== undefined ? dto.productId : current.productId,
                releaseId: dto.releaseId !== undefined ? dto.releaseId : current.releaseId,
            }
            : dto;
        await this.validateLinks(current.organizationId, links);
        const contentSource = this.normalizeKnowledgeContent(dto, current);
        if (dto.slug !== undefined)
            await this.assertKnowledgeSlugAvailable(current.organizationId, dto.slug, id);
        const row = await this.prisma.knowledgeBaseArticle.update({ where: { id }, data: {
                ...dto, ...contentSource, title: dto.title?.trim(), slug: dto.slug?.trim().toLowerCase(),
                summary: this.nullableTrim(dto.summary), category: this.nullableTrim(dto.category), nextReviewAt: this.nullableDate(dto.nextReviewAt, 'nextReviewAt'),
            }, include: knowledgeRelations });
        await this.log('technical-knowledge', id, 'technical-knowledge.updated', current.organizationId, user, current, row);
        return row;
    }
    async transitionKnowledge(id, dto, user) {
        const current = await this.getKnowledge(id, user);
        const target = this.enumValue(client_1.KnowledgeBaseStatus, dto.status, 'status');
        (0, technical_lifecycle_policy_1.assertTransition)('technical-knowledge', technical_lifecycle_policy_1.knowledgeTransitions, current.status, target);
        if (target === client_1.KnowledgeBaseStatus.PUBLISHED)
            this.require(user, 'technical-knowledge:publish');
        if (target === client_1.KnowledgeBaseStatus.ARCHIVED && !dto.reason?.trim()) {
            throw new common_1.BadRequestException({
                code: 'KNOWLEDGE_ARCHIVE_REASON_REQUIRED',
                message: 'برای بایگانی مقاله، ثبت دلیل الزامی است.',
            });
        }
        if (target === client_1.KnowledgeBaseStatus.PUBLISHED && current.nextReviewAt && current.nextReviewAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException({
                code: 'KNOWLEDGE_REVIEW_DATE_INVALID',
                message: 'تاریخ بازبینی بعدی مقاله باید در آینده باشد.',
            });
        }
        const now = new Date();
        const row = await this.prisma.knowledgeBaseArticle.update({ where: { id }, data: {
                status: target,
                ...(target === client_1.KnowledgeBaseStatus.PUBLISHED && { publishedAt: now, lastReviewedAt: now }),
                ...(target === client_1.KnowledgeBaseStatus.ARCHIVED && { archivedAt: now }),
            }, include: knowledgeRelations });
        const action = target === 'PUBLISHED' ? 'technical-knowledge.published' : target === 'ARCHIVED' ? 'technical-knowledge.archived' : 'technical-knowledge.transitioned';
        await this.log('technical-knowledge', id, action, current.organizationId, user, current, row, dto.reason);
        return row;
    }
    async listDocuments(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const where = {
            organizationId, archivedAt: null,
            ...(query.productId && { productId: query.productId }), ...(query.releaseId && { releaseId: query.releaseId }),
            ...(query.companyId && { companyId: query.companyId }), ...(query.opportunityId && { opportunityId: query.opportunityId }),
            ...(query.tenderId && { tenderId: query.tenderId }),
            ...(query.ownerId && { ownerId: query.ownerId }), ...(query.type && { documentType: query.type }),
            ...(query.confidentiality && { confidentiality: query.confidentiality }),
            ...(query.status && { status: this.enumValue(client_1.TechnicalDocumentStatus, query.status, 'status') }),
            ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }),
        };
        return this.page(query, () => this.prisma.technicalDocument.findMany({ where, include: documentListInclude, orderBy: this.sort(query, ['updatedAt', 'title', 'effectiveFrom', 'expiresAt'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.technicalDocument.count({ where }));
    }
    async getDocument(id, user) {
        const row = await this.prisma.technicalDocument.findFirst({ where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) }, include: documentInclude });
        if (!row)
            throw new common_1.NotFoundException('Technical document not found');
        return row;
    }
    async createDocument(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.validateLinks(organizationId, dto);
        const row = await this.prisma.technicalDocument.create({ data: {
                ...dto, title: dto.title.trim(), documentType: dto.documentType.trim(), description: dto.description?.trim(),
                effectiveFrom: this.date(dto.effectiveFrom, 'effectiveFrom'), expiresAt: this.date(dto.expiresAt, 'expiresAt'),
                organizationId, createdById: user.userId, updatedById: user.userId,
            }, include: documentInclude });
        await this.log('technical-document', row.id, 'technical-document.created', organizationId, user, undefined, row);
        return row;
    }
    async updateDocument(id, dto, user) {
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
    async transitionDocument(id, dto, user) {
        const current = await this.getDocument(id, user);
        const target = this.enumValue(client_1.TechnicalDocumentStatus, dto.status, 'status');
        (0, technical_lifecycle_policy_1.assertTransition)('technical-document', technical_lifecycle_policy_1.documentTransitions, current.status, target);
        if (['APPROVED', 'ACTIVE', 'SUPERSEDED'].includes(target))
            this.require(user, 'technical-document:approve');
        if (target === client_1.TechnicalDocumentStatus.IN_REVIEW ||
            target === client_1.TechnicalDocumentStatus.APPROVED) {
            const latest = await this.prisma.technicalDocumentVersion.findFirst({
                where: { organizationId: current.organizationId, documentId: id },
                orderBy: { createdAt: 'desc' },
                include: { attachment: { select: { id: true, deletedAt: true } } },
            });
            if (!latest?.attachment || latest.attachment.deletedAt) {
                throw new common_1.BadRequestException({
                    code: 'DOCUMENT_VERSION_FILE_REQUIRED',
                    message: 'برای ارسال سند به بازبینی، ابتدا یک نسخه دارای فایل بارگذاری کنید.',
                });
            }
        }
        await this.optimistic('technicalDocument', id, current.organizationId, dto.revision ?? current.revision, {
            status: target, updatedById: user.userId,
            ...(target === client_1.TechnicalDocumentStatus.ACTIVE && !current.effectiveFrom && { effectiveFrom: new Date() }),
            ...(target === client_1.TechnicalDocumentStatus.ARCHIVED && { archivedAt: new Date() }),
        });
        if (target === client_1.TechnicalDocumentStatus.APPROVED) {
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
    async addDocumentVersion(documentId, dto, user) {
        const document = await this.getDocument(documentId, user);
        this.assertMutable(document.archivedAt);
        if (document.status !== client_1.TechnicalDocumentStatus.DRAFT &&
            document.status !== client_1.TechnicalDocumentStatus.IN_REVIEW) {
            throw new common_1.BadRequestException({
                code: 'DOCUMENT_VERSION_LOCKED',
                message: 'افزودن نسخه فقط برای سند پیش‌نویس یا در حال بازبینی امکان‌پذیر است.',
            });
        }
        const duplicate = await this.prisma.technicalDocumentVersion.findFirst({
            where: { organizationId: document.organizationId, documentId, version: dto.version.trim() },
            select: { id: true },
        });
        if (duplicate) {
            throw new common_1.ConflictException({
                code: 'DUPLICATE_DOCUMENT_VERSION',
                message: 'این شماره نسخه قبلاً برای سند ثبت شده است.',
            });
        }
        if (dto.attachmentId)
            await this.assertAttachment(document.organizationId, dto.attachmentId, client_1.FileAttachmentEntityType.TECHNICAL_DOCUMENT, documentId);
        const row = await this.prisma.technicalDocumentVersion.create({ data: {
                organizationId: document.organizationId, documentId, version: dto.version.trim(), attachmentId: dto.attachmentId,
                contentHash: dto.contentHash?.trim(), createdById: user.userId,
            } });
        await this.log('technical-document-version', row.id, 'technical-document.version-created', document.organizationId, user, undefined, row);
        return row;
    }
    async listDocumentVersions(documentId, user) {
        const document = await this.getDocument(documentId, user);
        return this.prisma.technicalDocumentVersion.findMany({
            where: { organizationId: document.organizationId, documentId },
            include: documentVersionInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getDocumentVersion(documentId, versionId, user) {
        const document = await this.getDocument(documentId, user);
        const row = await this.prisma.technicalDocumentVersion.findFirst({
            where: { id: versionId, organizationId: document.organizationId, documentId },
            include: documentVersionInclude,
        });
        if (!row)
            throw new common_1.NotFoundException('Technical document version not found');
        return row;
    }
    async listResources(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const where = {
            organizationId, archivedAt: null,
            ...(query.productId && { productId: query.productId }), ...(query.releaseId && { releaseId: query.releaseId }),
            ...(query.ownerId && { ownerId: query.ownerId }),
            ...(query.status && { status: this.enumValue(client_1.TechnicalResourceStatus, query.status, 'status') }),
            ...(query.type && { resourceType: this.enumValue(client_1.TechnicalResourceType, query.type, 'type') }),
            ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }),
        };
        const page = await this.page(query, () => this.prisma.technicalResource.findMany({ where, include: resourceRelations, orderBy: this.sort(query, ['updatedAt', 'title', 'version'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.technicalResource.count({ where }));
        return { ...page, data: await this.withResourceArtifactCounts(page.data, organizationId) };
    }
    async getResource(id, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const row = await this.prisma.technicalResource.findFirst({ where: { id, organizationId }, include: resourceRelations });
        if (!row)
            throw new common_1.NotFoundException('Technical resource not found');
        return (await this.withResourceArtifactCounts([row], organizationId))[0];
    }
    async createResource(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        this.assertResourceSource(dto.resourceType, dto.url);
        await this.validateLinks(organizationId, dto);
        const row = await this.prisma.technicalResource.create({ data: {
                ...dto, title: dto.title.trim(), description: dto.description?.trim(), version: dto.version?.trim(), checksum: dto.checksum?.trim(),
                organizationId, createdById: user.userId, updatedById: user.userId,
            }, include: resourceRelations });
        await this.log('technical-resource', row.id, 'technical-resource.created', organizationId, user, undefined, row);
        return row;
    }
    async updateResource(id, dto, user) {
        const current = await this.getResource(id, user);
        this.assertMutable(current.archivedAt);
        this.assertResourceSource(dto.resourceType ?? current.resourceType, dto.url ?? current.url);
        const links = dto.productId !== undefined || dto.releaseId !== undefined
            ? { ...dto, productId: dto.productId ?? current.productId, releaseId: dto.releaseId ?? current.releaseId }
            : dto;
        await this.validateLinks(current.organizationId, links);
        if (dto.attachmentId)
            await this.assertAttachment(current.organizationId, dto.attachmentId, client_1.FileAttachmentEntityType.TECHNICAL_RESOURCE, id);
        const row = await this.prisma.technicalResource.update({ where: { id }, data: {
                ...dto, title: dto.title?.trim(), description: dto.description?.trim(), version: dto.version?.trim(), checksum: dto.checksum?.trim(),
                updatedById: user.userId, ...(dto.status === 'ARCHIVED' && { archivedAt: new Date() }),
            } });
        const action = dto.status === 'DEPRECATED' ? 'technical-resource.deprecated' : dto.status === 'ARCHIVED' ? 'technical-resource.archived' : 'technical-resource.updated';
        await this.log('technical-resource', id, action, current.organizationId, user, current, row);
        return row;
    }
    async listTenders(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const where = {
            organizationId, archivedAt: null,
            ...(query.companyId && { companyId: query.companyId }), ...(query.opportunityId && { opportunityId: query.opportunityId }),
            ...(query.ownerId && { ownerId: query.ownerId }), ...(query.teamId && { teamId: query.teamId }),
            ...(query.status && { status: this.enumValue(client_1.TenderStatus, query.status, 'status') }),
            ...(query.type && { tenderType: this.enumValue(client_1.TenderType, query.type, 'type') }),
            ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { referenceNumber: { contains: query.search, mode: 'insensitive' } }] }),
            ...(this.range(query) && { submissionDeadline: this.range(query) }),
        };
        const page = await this.page(query, () => this.prisma.tender.findMany({ where, include: tenderInclude, orderBy: this.sort(query, ['updatedAt', 'title', 'submissionDeadline', 'estimatedValue'], 'updatedAt'), skip: this.skip(query), take: query.limit }), () => this.prisma.tender.count({ where }));
        return { ...page, data: page.data.map((row) => ({ ...row, readiness: this.evaluateReadiness(row) })) };
    }
    async getTender(id, user) {
        const row = await this.prisma.tender.findFirst({ where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) }, include: tenderInclude });
        if (!row)
            throw new common_1.NotFoundException('Technical tender not found');
        return { ...row, readiness: this.evaluateReadiness(row) };
    }
    async createTender(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.validateLinks(organizationId, dto);
        const row = await this.prisma.tender.create({ data: {
                ...dto, title: dto.title.trim(), referenceNumber: dto.referenceNumber?.trim(), description: dto.description?.trim(), source: dto.source?.trim(),
                submissionDeadline: this.date(dto.submissionDeadline, 'submissionDeadline'), technicalDeadline: this.date(dto.technicalDeadline, 'technicalDeadline'),
                expectedDecisionDate: this.date(dto.expectedDecisionDate, 'expectedDecisionDate'),
                estimatedValue: dto.estimatedValue === undefined ? undefined : new client_1.Prisma.Decimal(dto.estimatedValue), currency: dto.currency?.toUpperCase(),
                organizationId, createdById: user.userId, updatedById: user.userId,
            }, include: tenderInclude });
        await this.log('technical-tender', row.id, 'technical-tender.created', organizationId, user, undefined, row);
        return row;
    }
    async updateTender(id, dto, user) {
        const current = await this.getTender(id, user);
        this.assertMutable(current.archivedAt);
        await this.validateLinks(current.organizationId, dto);
        const { revision, ...input } = dto;
        await this.optimistic('tender', id, current.organizationId, revision ?? current.revision, {
            ...input, title: input.title?.trim(), referenceNumber: input.referenceNumber?.trim(), description: input.description?.trim(), source: input.source?.trim(),
            submissionDeadline: this.date(input.submissionDeadline, 'submissionDeadline'), technicalDeadline: this.date(input.technicalDeadline, 'technicalDeadline'),
            expectedDecisionDate: this.date(input.expectedDecisionDate, 'expectedDecisionDate'),
            estimatedValue: input.estimatedValue === undefined ? undefined : new client_1.Prisma.Decimal(input.estimatedValue), currency: input.currency?.toUpperCase(), updatedById: user.userId,
        });
        const row = await this.getTender(id, user);
        await this.log('technical-tender', id, 'technical-tender.updated', current.organizationId, user, current, row);
        return row;
    }
    async updateTenderQualification(id, dto, user) {
        const current = await this.getTender(id, user);
        this.assertTenderOpen(current.status);
        const nextDecision = dto.qualificationDecision ?? current.qualificationDecision;
        const nextBidDecision = dto.bidDecision ?? current.bidDecision;
        const conditions = dto.qualificationConditions ?? current.qualificationConditions;
        const reason = dto.decisionReason ?? current.decisionReason;
        if (nextDecision === client_1.TenderQualificationDecision.CONDITIONAL_GO && !conditions?.trim()) {
            throw new common_1.BadRequestException({ code: 'QUALIFICATION_CONDITIONS_REQUIRED', message: 'برای «ادامه مشروط» باید شرایط ادامه را مشخص کنید' });
        }
        if ((nextDecision === client_1.TenderQualificationDecision.NO_GO || nextBidDecision === client_1.TenderBidDecision.NO_BID) && !reason?.trim()) {
            throw new common_1.BadRequestException({ code: 'QUALIFICATION_DECISION_REASON_REQUIRED', message: 'برای «عدم ادامه» یا «شرکت نمی‌کنیم» باید دلیل تصمیم را ثبت کنید' });
        }
        const { revision, ...input } = dto;
        const textFields = ['fitNotes', 'riskNotes', 'feasibilityNotes', 'qualificationSummary', 'qualificationConditions', 'decisionReason'];
        const data = { ...input, updatedById: user.userId };
        for (const field of textFields)
            if (input[field] !== undefined)
                data[field] = input[field]?.trim() || null;
        await this.optimistic('tender', id, current.organizationId, revision ?? current.revision, data);
        const row = await this.getTender(id, user);
        await this.log('technical-tender', id, 'technical-tender.qualification-updated', current.organizationId, user, current, row);
        return row;
    }
    async transitionTender(id, dto, user) {
        const current = await this.getTender(id, user);
        const target = this.enumValue(client_1.TenderStatus, dto.status, 'status');
        (0, technical_lifecycle_policy_1.assertTransition)('technical-tender', technical_lifecycle_policy_1.tenderTransitions, current.status, target);
        if (target === client_1.TenderStatus.SUBMITTED)
            this.require(user, 'technical-tender:submit');
        if (['WON', 'LOST', 'CANCELLED', 'ARCHIVED'].includes(target))
            this.require(user, 'technical-tender:close');
        if ((target === client_1.TenderStatus.LOST || target === client_1.TenderStatus.CANCELLED) && !dto.reason?.trim()) {
            throw new common_1.BadRequestException({ code: 'TENDER_CLOSE_REASON_REQUIRED', message: 'برای ثبت نتیجه «از دست رفته» یا لغو مناقصه باید دلیل را وارد کنید' });
        }
        if (this.isReopen(current.status, target) && !dto.reason?.trim()) {
            throw new common_1.BadRequestException({ code: 'TENDER_REOPEN_REASON_REQUIRED', message: 'برای بازگشت به مرحله قبل باید دلیل اصلاح را ثبت کنید' });
        }
        if (current.status === client_1.TenderStatus.QUALIFICATION && target === client_1.TenderStatus.PREPARING) {
            if (current.bidDecision !== client_1.TenderBidDecision.BID) {
                throw new common_1.BadRequestException({ code: 'TENDER_BID_DECISION_REQUIRED', message: 'برای ورود به آماده‌سازی، تصمیم شرکت در مناقصه باید «شرکت می‌کنیم» باشد' });
            }
            if (![client_1.TenderQualificationDecision.GO, client_1.TenderQualificationDecision.CONDITIONAL_GO].includes(current.qualificationDecision)) {
                throw new common_1.BadRequestException({ code: 'TENDER_QUALIFICATION_APPROVAL_REQUIRED', message: 'برای ورود به آماده‌سازی، نتیجه ارزیابی اولیه باید «ادامه» یا «ادامه مشروط» باشد' });
            }
        }
        if (current.status === client_1.TenderStatus.TECHNICAL_REVIEW && target === client_1.TenderStatus.COMMERCIAL_REVIEW) {
            const readiness = this.evaluateReadiness(current);
            if (readiness.checks.technicalReview.status !== client_1.TenderReviewStatus.APPROVED)
                throw new common_1.BadRequestException({ code: 'TECHNICAL_REVIEW_NOT_APPROVED', message: 'قبل از ورود به بازبینی تجاری، تأیید فنی را ثبت کنید' });
        }
        if (target === client_1.TenderStatus.READY_FOR_SUBMISSION || target === client_1.TenderStatus.SUBMITTED) {
            const readiness = this.evaluateReadiness(current);
            if (!readiness.overallReady)
                throw new common_1.BadRequestException({ code: 'TENDER_NOT_READY', message: 'مناقصه هنوز برای ارسال آماده نیست؛ موارد اعلام‌شده را تکمیل کنید', details: { blockers: readiness.blockers, checks: readiness.checks } });
        }
        const result = target === client_1.TenderStatus.WON ? client_1.TenderResult.WON : target === client_1.TenderStatus.LOST ? client_1.TenderResult.LOST : target === client_1.TenderStatus.CANCELLED ? client_1.TenderResult.CANCELLED : undefined;
        await this.optimistic('tender', id, current.organizationId, dto.revision ?? current.revision, {
            status: target, updatedById: user.userId, ...(result && { result, resultReason: dto.reason?.trim() }),
            ...(target === client_1.TenderStatus.SUBMITTED && { submittedAt: new Date(), submittedById: user.userId }),
            ...((target === client_1.TenderStatus.WON || target === client_1.TenderStatus.LOST || target === client_1.TenderStatus.CANCELLED) && { closedAt: new Date(), closedById: user.userId }),
            ...(target === client_1.TenderStatus.ARCHIVED && { archivedAt: new Date() }),
        });
        const row = await this.getTender(id, user);
        const named = ['SUBMITTED', 'WON', 'LOST', 'CANCELLED', 'ARCHIVED'].includes(target);
        await this.log('technical-tender', id, named ? `technical-tender.${target.toLowerCase()}` : 'technical-tender.transitioned', current.organizationId, user, current, row, dto.reason);
        if (target === client_1.TenderStatus.SUBMITTED)
            await this.notifyTender(row.ownerId, user, id, 'مناقصه ارسال شد', row.title);
        return row;
    }
    async addRequirement(tenderId, dto, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        if (dto.ownerId)
            await this.assertUser(tender.organizationId, dto.ownerId);
        if (dto.parentRequirementId)
            await this.assertRequirementParent(tenderId, undefined, dto.parentRequirementId, tender.organizationId);
        if (dto.dependencyIds?.length)
            await this.assertRequirementIds(tenderId, dto.dependencyIds, tender.organizationId);
        if (dto.status === client_1.TenderRequirementStatus.BLOCKED && !dto.blockedReason?.trim()) {
            throw new common_1.BadRequestException({ code: 'REQUIREMENT_BLOCK_REASON_REQUIRED', message: 'A reason is required when blocking a requirement' });
        }
        const { dependencyIds, ...input } = dto;
        const row = await this.prisma.tenderRequirement.create({ data: {
                ...input, title: dto.title.trim(), category: dto.category?.trim(), description: dto.description?.trim(), response: dto.response?.trim(),
                section: dto.section?.trim(), page: dto.page?.trim(), referenceId: dto.referenceId?.trim(), notes: dto.notes?.trim(), blockedReason: dto.blockedReason?.trim(),
                dueDate: this.date(dto.dueDate, 'dueDate'), organizationId: tender.organizationId, tenderId,
                ...(dto.status === client_1.TenderRequirementStatus.BLOCKED && { blockedAt: new Date(), blockedById: user.userId }),
                ...(dependencyIds?.length && { dependencies: { create: [...new Set(dependencyIds)].map((dependsOnRequirementId) => ({ dependsOnRequirementId })) } }),
            }, include: resourceRelations });
        await this.log('tender-requirement', row.id, 'technical-tender.requirement-created', tender.organizationId, user, undefined, row);
        return row;
    }
    async listRequirements(tenderId, user) {
        const tender = await this.getTender(tenderId, user);
        return this.prisma.tenderRequirement.findMany({
            where: { organizationId: tender.organizationId, tenderId },
            include: {
                owner: { select: { id: true, fullName: true, email: true } },
                task: { select: { id: true, title: true, status: true, assignedToId: true } },
                dependencies: { include: { dependsOnRequirement: { select: { id: true, title: true, referenceId: true, status: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async updateRequirement(tenderId, requirementId, dto, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        const current = await this.prisma.tenderRequirement.findFirst({ where: { id: requirementId, tenderId, organizationId: tender.organizationId }, include: { dependencies: { select: { dependsOnRequirementId: true } } } });
        if (!current)
            throw new common_1.NotFoundException('Tender requirement not found');
        if (dto.ownerId)
            await this.assertUser(tender.organizationId, dto.ownerId);
        if (dto.parentRequirementId)
            await this.assertRequirementParent(tenderId, requirementId, dto.parentRequirementId, tender.organizationId);
        if (dto.dependencyIds) {
            await this.assertRequirementIds(tenderId, dto.dependencyIds, tender.organizationId);
            for (const dependencyId of dto.dependencyIds)
                await this.assertNoDependencyCycle(tenderId, requirementId, dependencyId, tender.organizationId);
        }
        if (dto.status === client_1.TenderRequirementStatus.BLOCKED && !dto.blockedReason?.trim()) {
            throw new common_1.BadRequestException({ code: 'REQUIREMENT_BLOCK_REASON_REQUIRED', message: 'A reason is required when blocking a requirement' });
        }
        const { dependencyIds, ...input } = dto;
        const row = await this.prisma.tenderRequirement.update({ where: { id: requirementId }, data: {
                ...input, title: dto.title?.trim(), category: dto.category?.trim(), description: dto.description?.trim(), response: dto.response?.trim(), blockedReason: dto.blockedReason?.trim(), dueDate: this.date(dto.dueDate, 'dueDate'),
                section: dto.section?.trim(), page: dto.page?.trim(), referenceId: dto.referenceId?.trim(), notes: dto.notes?.trim(),
                ...(dependencyIds && { dependencies: { deleteMany: {}, create: [...new Set(dependencyIds)].map((dependsOnRequirementId) => ({ dependsOnRequirementId })) } }),
                ...(dto.status === client_1.TenderRequirementStatus.BLOCKED ? { blockedAt: new Date(), blockedById: user.userId } : dto.status ? { blockedAt: null, blockedById: null, blockedReason: null } : {}),
            } });
        const action = dto.status && dto.status !== current.status
            ? 'technical-tender.requirement-status-changed'
            : dto.ownerId !== undefined && dto.ownerId !== current.ownerId
                ? 'technical-tender.requirement-owner-changed'
                : 'technical-tender.requirement-updated';
        await this.log('tender-requirement', row.id, action, tender.organizationId, user, current, row);
        if (dependencyIds)
            await this.log('tender-requirement', row.id, 'technical-tender.requirement-dependencies-changed', tender.organizationId, user, { id: row.id, tenderId, dependencyIds: current.dependencies.map((dependency) => dependency.dependsOnRequirementId) }, { id: row.id, tenderId, dependencyIds });
        if (dto.status === client_1.TenderRequirementStatus.BLOCKED && row.ownerId)
            await this.notifyTender(row.ownerId, user, tenderId, 'الزام مناقصه مسدود شد', row.title, client_1.NotificationPriority.HIGH);
        return row;
    }
    async removeRequirement(tenderId, requirementId, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        const current = await this.prisma.tenderRequirement.findFirst({ where: { id: requirementId, tenderId, organizationId: tender.organizationId } });
        if (!current)
            throw new common_1.NotFoundException('Tender requirement not found');
        await this.prisma.tenderRequirement.delete({ where: { id: requirementId } });
        await this.log('tender-requirement', requirementId, 'technical-tender.requirement-deleted', tender.organizationId, user, current);
        return { id: requirementId, deleted: true };
    }
    async addRequirementDependency(tenderId, requirementId, dto, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        await this.getRequirement(tenderId, requirementId, tender.organizationId);
        await this.assertRequirementIds(tenderId, [dto.dependsOnRequirementId], tender.organizationId);
        await this.assertNoDependencyCycle(tenderId, requirementId, dto.dependsOnRequirementId, tender.organizationId);
        try {
            const row = await this.prisma.tenderRequirementDependency.create({ data: { requirementId, dependsOnRequirementId: dto.dependsOnRequirementId } });
            await this.log('tender-requirement', requirementId, 'technical-tender.requirement-dependency-added', tender.organizationId, user, undefined, row);
            return row;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
                throw new common_1.ConflictException({ code: 'REQUIREMENT_DEPENDENCY_EXISTS', message: 'Dependency already exists' });
            throw error;
        }
    }
    async removeRequirementDependency(tenderId, requirementId, dependencyId, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        const current = await this.prisma.tenderRequirementDependency.findFirst({ where: { id: dependencyId, requirementId, requirement: { tenderId, organizationId: tender.organizationId } } });
        if (!current)
            throw new common_1.NotFoundException('Tender requirement dependency not found');
        await this.prisma.tenderRequirementDependency.delete({ where: { id: dependencyId } });
        await this.log('tender-requirement', requirementId, 'technical-tender.requirement-dependency-removed', tender.organizationId, user, current);
        return { id: dependencyId, deleted: true };
    }
    async linkRequirementTask(tenderId, requirementId, dto, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        this.require(user, 'task:view');
        const requirement = await this.getRequirement(tenderId, requirementId, tender.organizationId);
        const task = await this.tasks.findOne(dto.taskId, user);
        if (task.organizationId !== tender.organizationId)
            throw new common_1.BadRequestException({ code: 'TASK_TENANT_MISMATCH', message: 'Task must belong to the same organization' });
        const row = await this.prisma.tenderRequirement.update({ where: { id: requirementId }, data: { taskId: task.id } });
        await this.log('tender-requirement', requirementId, 'technical-tender.requirement-task-linked', tender.organizationId, user, requirement, row);
        return row;
    }
    async listTenderCurrencyOptions() {
        const rates = await this.prisma.currencyExchangeRate.findMany({
            select: { baseCurrency: true, quoteCurrency: true },
        });
        const codes = new Set(['IRR']);
        for (const rate of rates) {
            if (rate.baseCurrency?.trim())
                codes.add(rate.baseCurrency.trim().toUpperCase());
            if (rate.quoteCurrency?.trim())
                codes.add(rate.quoteCurrency.trim().toUpperCase());
        }
        return [...codes].sort((left, right) => left === 'IRR' ? -1 : right === 'IRR' ? 1 : left.localeCompare(right)).map((code) => ({ id: code, label: code }));
    }
    async createRequirementTask(tenderId, requirementId, dto, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        this.require(user, 'task:create');
        const requirement = await this.getRequirement(tenderId, requirementId, tender.organizationId);
        const reference = requirement.referenceId ? ` [${requirement.referenceId}]` : '';
        const context = `الزام مناقصه «${tender.title}»${reference}`;
        const task = await this.tasks.create({
            title: dto.title?.trim() || `پیگیری الزام: ${requirement.title}`,
            description: [dto.description?.trim(), context, requirement.description].filter(Boolean).join('\n\n'),
            priority: dto.priority,
            dueAt: dto.dueAt,
            assignedToId: dto.assignedToId,
            assignmentScope: dto.assignmentScope,
            teamId: dto.teamId,
            companyId: tender.companyId ?? undefined,
            opportunityId: tender.opportunityId ?? undefined,
        }, user);
        const row = await this.prisma.tenderRequirement.update({ where: { id: requirementId }, data: { taskId: task.id } });
        await this.log('tender-requirement', requirementId, 'technical-tender.requirement-task-created', tender.organizationId, user, requirement, row);
        return { requirement: row, task };
    }
    async unlinkRequirementTask(tenderId, requirementId, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        const requirement = await this.getRequirement(tenderId, requirementId, tender.organizationId);
        if (!requirement.taskId)
            return requirement;
        const row = await this.prisma.tenderRequirement.update({ where: { id: requirementId }, data: { taskId: null } });
        await this.log('tender-requirement', requirementId, 'technical-tender.requirement-task-unlinked', tender.organizationId, user, requirement, row);
        return row;
    }
    async addDeliverable(tenderId, dto, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        const document = await this.prisma.technicalDocument.findFirst({ where: { id: dto.documentId, organizationId: tender.organizationId, archivedAt: null } });
        if (!document)
            throw new common_1.NotFoundException('Technical document not found');
        const duplicate = await this.prisma.tenderDeliverable.findFirst({
            where: { organizationId: tender.organizationId, tenderId, documentId: dto.documentId },
            select: { id: true },
        });
        if (duplicate) {
            throw new common_1.ConflictException({
                code: 'DUPLICATE_TENDER_DELIVERABLE',
                message: 'این سند قبلاً به اقلام تحویلی مناقصه متصل شده است.',
            });
        }
        const row = await this.prisma.tenderDeliverable.create({ data: { organizationId: tender.organizationId, tenderId, documentId: dto.documentId, label: dto.label?.trim(), required: dto.required ?? true } });
        await this.log('tender-deliverable', row.id, 'technical-tender.deliverable-created', tender.organizationId, user, undefined, row);
        return row;
    }
    async removeDeliverable(tenderId, deliverableId, user) {
        const tender = await this.getTender(tenderId, user);
        this.assertTenderOpen(tender.status);
        const current = await this.prisma.tenderDeliverable.findFirst({ where: { id: deliverableId, tenderId, organizationId: tender.organizationId } });
        if (!current)
            throw new common_1.NotFoundException('Tender deliverable not found');
        await this.prisma.tenderDeliverable.delete({ where: { id: deliverableId } });
        await this.log('tender-deliverable', deliverableId, 'technical-tender.deliverable-deleted', tender.organizationId, user, current);
        return { id: deliverableId, deleted: true };
    }
    async getTenderReadiness(id, user) {
        const tender = await this.getTender(id, user);
        return tender.readiness;
    }
    async listTenderReviews(id, user) {
        const tender = await this.getTender(id, user);
        return tender.reviews;
    }
    async requestTenderReview(id, dto, user) {
        const tender = await this.getTender(id, user);
        this.assertTenderOpen(tender.status);
        const permission = dto.type === client_1.TenderReviewType.TECHNICAL ? 'technical-tender:review-technical' : 'technical-tender:review-commercial';
        this.require(user, permission);
        const expectedStatus = dto.type === client_1.TenderReviewType.TECHNICAL ? client_1.TenderStatus.TECHNICAL_REVIEW : client_1.TenderStatus.COMMERCIAL_REVIEW;
        if (tender.status !== expectedStatus)
            throw new common_1.BadRequestException({ code: 'REVIEW_NOT_AVAILABLE_IN_CURRENT_STATUS', message: `این بازبینی فقط در مرحله ${expectedStatus === client_1.TenderStatus.TECHNICAL_REVIEW ? 'بازبینی فنی' : 'بازبینی تجاری'} قابل درخواست است` });
        if (dto.reviewerId)
            await this.assertUser(tender.organizationId, dto.reviewerId);
        if (dto.revision !== undefined && dto.revision !== tender.revision)
            throw new common_1.ConflictException({ code: 'REVISION_CONFLICT', message: 'The tender was changed by another request' });
        const pending = tender.reviews.find((review) => review.type === dto.type && review.status === client_1.TenderReviewStatus.PENDING);
        if (pending)
            throw new common_1.ConflictException({ code: 'REVIEW_ALREADY_PENDING', message: 'برای این نوع بازبینی یک درخواست در انتظار وجود دارد' });
        let row;
        try {
            row = await this.prisma.$transaction(async (tx) => {
                const revision = await tx.tender.updateMany({ where: { id, organizationId: tender.organizationId, revision: tender.revision }, data: { revision: { increment: 1 }, updatedById: user.userId } });
                if (revision.count !== 1)
                    throw new common_1.ConflictException({ code: 'REVISION_CONFLICT', message: 'The tender was changed by another request' });
                return tx.tenderReview.create({
                    data: { organizationId: tender.organizationId, tenderId: id, type: dto.type, reviewerId: dto.reviewerId, requestedById: user.userId, comment: dto.comment?.trim() },
                    include: { reviewer: true, requestedBy: true, decidedBy: true },
                });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
                throw new common_1.ConflictException({ code: 'REVIEW_ALREADY_PENDING', message: 'برای این نوع بازبینی یک درخواست در انتظار وجود دارد' });
            throw error;
        }
        await this.log('technical-tender', id, `technical-tender.review-${dto.type.toLowerCase()}-requested`, tender.organizationId, user, undefined, row, dto.comment);
        if (row.reviewerId)
            await this.notifyTender(row.reviewerId, user, id, dto.type === client_1.TenderReviewType.TECHNICAL ? 'بازبینی فنی جدید' : 'بازبینی تجاری جدید', tender.title);
        return row;
    }
    async decideTenderReview(id, reviewId, dto, user) {
        const tender = await this.getTender(id, user);
        this.assertTenderOpen(tender.status);
        const review = await this.prisma.tenderReview.findFirst({ where: { id: reviewId, tenderId: id, organizationId: tender.organizationId } });
        if (!review)
            throw new common_1.NotFoundException('Tender review not found');
        const permission = review.type === client_1.TenderReviewType.TECHNICAL ? 'technical-tender:review-technical' : 'technical-tender:review-commercial';
        this.require(user, permission);
        if (review.status !== client_1.TenderReviewStatus.PENDING)
            throw new common_1.ConflictException({ code: 'REVIEW_ALREADY_DECIDED', message: 'نتیجه این بازبینی قبلاً ثبت شده است' });
        if (dto.status !== client_1.TenderReviewStatus.APPROVED && dto.status !== client_1.TenderReviewStatus.REJECTED && dto.status !== client_1.TenderReviewStatus.CANCELLED) {
            throw new common_1.BadRequestException({ code: 'INVALID_REVIEW_DECISION', message: 'نتیجه بازبینی باید تأیید، رد یا لغو باشد' });
        }
        if (dto.status === client_1.TenderReviewStatus.REJECTED && !dto.comment?.trim())
            throw new common_1.BadRequestException({ code: 'REVIEW_REJECTION_REASON_REQUIRED', message: 'برای رد بازبینی باید دلیل را ثبت کنید' });
        if (dto.revision !== undefined && dto.revision !== tender.revision)
            throw new common_1.ConflictException({ code: 'REVISION_CONFLICT', message: 'The tender was changed by another request' });
        const row = await this.prisma.$transaction(async (tx) => {
            const revision = await tx.tender.updateMany({ where: { id, organizationId: tender.organizationId, revision: tender.revision }, data: { revision: { increment: 1 }, updatedById: user.userId } });
            if (revision.count !== 1)
                throw new common_1.ConflictException({ code: 'REVISION_CONFLICT', message: 'The tender was changed by another request' });
            const decision = await tx.tenderReview.updateMany({ where: { id: reviewId, tenderId: id, organizationId: tender.organizationId, status: client_1.TenderReviewStatus.PENDING }, data: { status: dto.status, decidedById: user.userId, reviewedAt: new Date(), comment: dto.comment?.trim() } });
            if (decision.count !== 1)
                throw new common_1.ConflictException({ code: 'REVIEW_ALREADY_DECIDED', message: 'نتیجه این بازبینی قبلاً ثبت شده است' });
            return tx.tenderReview.findUniqueOrThrow({ where: { id: reviewId } });
        });
        await this.log('technical-tender', id, `technical-tender.review-${review.type.toLowerCase()}-${dto.status.toLowerCase()}`, tender.organizationId, user, review, row, dto.comment);
        if (dto.status === client_1.TenderReviewStatus.REJECTED)
            await this.notifyTender(tender.ownerId, user, id, 'بازبینی مناقصه رد شد', dto.comment || tender.title, client_1.NotificationPriority.HIGH);
        return row;
    }
    async tenderHistory(id, user) {
        const tender = await this.getTender(id, user);
        return this.prisma.auditLog.findMany({
            where: { organizationId: tender.organizationId, entityType: 'technical-tender', entityId: id },
            orderBy: { createdAt: 'desc' }, take: 100,
            select: { id: true, action: true, before: true, after: true, metadata: true, actorId: true, createdAt: true },
        });
    }
    evaluateReadiness(tender) {
        const now = new Date();
        const requirements = tender.requirements ?? [];
        const mandatory = requirements.filter((row) => row.mandatory);
        const mandatoryVerified = mandatory.filter((row) => row.status === client_1.TenderRequirementStatus.VERIFIED);
        const unresolved = mandatory.filter((row) => row.status !== client_1.TenderRequirementStatus.VERIFIED);
        const blocked = requirements.filter((row) => row.status === client_1.TenderRequirementStatus.BLOCKED);
        const overdue = requirements.filter((row) => row.status !== client_1.TenderRequirementStatus.VERIFIED && row.dueDate && new Date(row.dueDate) < now);
        const unassigned = requirements.filter((row) => row.status !== client_1.TenderRequirementStatus.VERIFIED && !row.ownerId);
        const withoutTask = requirements.filter((row) => !row.taskId);
        const dependencyBlocked = requirements.filter((row) => row.dependencies?.some((dependency) => ![client_1.TenderRequirementStatus.VERIFIED, client_1.TenderRequirementStatus.NOT_APPLICABLE].includes(dependency.dependsOnRequirement?.status)));
        const criticalUnsatisfied = requirements.filter((row) => row.mandatory && ![client_1.TenderRequirementStatus.VERIFIED, client_1.TenderRequirementStatus.NOT_APPLICABLE].includes(row.status));
        const dueAfterSubmission = tender.submissionDeadline
            ? requirements.filter((row) => row.dueDate && new Date(row.dueDate) > new Date(tender.submissionDeadline))
            : [];
        const deliverables = tender.deliverables ?? [];
        const requiredDeliverables = deliverables.filter((row) => row.required !== false);
        const completedDeliverables = requiredDeliverables.filter((row) => ['APPROVED', 'ACTIVE'].includes(row.document?.status) && Boolean(row.document?.versions?.some((version) => version.attachmentId)));
        const latest = (type) => (tender.reviews ?? []).find((row) => row.type === type);
        const technicalReview = latest(client_1.TenderReviewType.TECHNICAL);
        const commercialReview = latest(client_1.TenderReviewType.COMMERCIAL);
        const requiredFields = ['title', 'ownerId', 'tenderType', 'companyId', 'submissionDeadline'];
        const missingFields = requiredFields.filter((field) => !tender[field]);
        const deadlinePassed = Boolean(tender.submissionDeadline && new Date(tender.submissionDeadline) < now && !tender.submittedAt);
        const blockers = [];
        const warnings = [];
        if (unresolved.length)
            blockers.push({ code: 'MANDATORY_REQUIREMENTS_INCOMPLETE', count: unresolved.length });
        if (mandatory.some((row) => row.status !== client_1.TenderRequirementStatus.VERIFIED && !row.ownerId))
            blockers.push({ code: 'MANDATORY_REQUIREMENTS_UNASSIGNED', count: mandatory.filter((row) => row.status !== client_1.TenderRequirementStatus.VERIFIED && !row.ownerId).length });
        if (completedDeliverables.length !== requiredDeliverables.length)
            blockers.push({ code: 'REQUIRED_DELIVERABLES_INCOMPLETE', count: requiredDeliverables.length - completedDeliverables.length });
        if (tender.bidDecision !== client_1.TenderBidDecision.BID)
            blockers.push({ code: 'TENDER_BID_DECISION_REQUIRED' });
        if (![client_1.TenderQualificationDecision.GO, client_1.TenderQualificationDecision.CONDITIONAL_GO].includes(tender.qualificationDecision))
            blockers.push({ code: 'TENDER_QUALIFICATION_APPROVAL_REQUIRED' });
        if (technicalReview?.status !== client_1.TenderReviewStatus.APPROVED)
            blockers.push({ code: 'TECHNICAL_REVIEW_NOT_APPROVED' });
        if (commercialReview?.status !== client_1.TenderReviewStatus.APPROVED)
            blockers.push({ code: 'COMMERCIAL_REVIEW_NOT_APPROVED' });
        if (missingFields.length)
            blockers.push({ code: 'REQUIRED_TENDER_FIELDS_INCOMPLETE', fields: missingFields });
        if (deadlinePassed)
            blockers.push({ code: 'TENDER_DEADLINE_PASSED' });
        if (dueAfterSubmission.length)
            warnings.push({ code: 'REQUIREMENT_DUE_AFTER_SUBMISSION', count: dueAfterSubmission.length });
        if (overdue.length)
            warnings.push({ code: 'REQUIREMENTS_OVERDUE', count: overdue.length });
        if (dependencyBlocked.length)
            warnings.push({ code: 'REQUIREMENT_DEPENDENCIES_UNRESOLVED', count: dependencyBlocked.length });
        if (tender.qualificationDecision === client_1.TenderQualificationDecision.GO && criticalUnsatisfied.length)
            warnings.push({ code: 'GO_WITH_UNSATISFIED_REQUIREMENTS', count: criticalUnsatisfied.length });
        return {
            overallReady: blockers.length === 0,
            blockers,
            warnings,
            qualification: {
                bidDecision: tender.bidDecision,
                qualificationDecision: tender.qualificationDecision,
                fitScore: tender.fitScore,
                riskScore: tender.riskScore,
                feasibilityScore: tender.feasibilityScore,
                qualificationConditions: tender.qualificationConditions,
                decisionReason: tender.decisionReason,
                qualificationSummary: tender.qualificationSummary,
            },
            requirementSummary: {
                totalRequirements: requirements.length,
                satisfiedRequirements: requirements.filter((row) => row.status === client_1.TenderRequirementStatus.VERIFIED).length,
                openRequirements: requirements.filter((row) => [client_1.TenderRequirementStatus.OPEN, client_1.TenderRequirementStatus.IN_PROGRESS, client_1.TenderRequirementStatus.READY].includes(row.status)).length,
                blockedRequirements: blocked.length,
                criticalUnsatisfiedRequirements: criticalUnsatisfied.length,
                requirementsWithoutOwner: requirements.filter((row) => !row.ownerId).length,
                requirementsWithoutTask: withoutTask.length,
                dependencyBlockedRequirements: dependencyBlocked.length,
            },
            checks: {
                mandatoryRequirements: { total: mandatory.length, satisfied: mandatoryVerified.length, unresolved: unresolved.length, blocked: mandatory.filter((row) => row.status === client_1.TenderRequirementStatus.BLOCKED).length },
                requirements: { total: requirements.length, verified: requirements.filter((row) => row.status === client_1.TenderRequirementStatus.VERIFIED).length, inProgress: requirements.filter((row) => row.status === client_1.TenderRequirementStatus.IN_PROGRESS).length, open: requirements.filter((row) => row.status === client_1.TenderRequirementStatus.OPEN).length, blocked: blocked.length, overdue: overdue.length, unassigned: unassigned.length },
                deliverables: { total: deliverables.length, required: requiredDeliverables.length, completedRequired: completedDeliverables.length, missing: requiredDeliverables.length - completedDeliverables.length },
                technicalReview: { status: technicalReview?.status ?? 'NOT_STARTED', reviewId: technicalReview?.id ?? null },
                commercialReview: { status: commercialReview?.status ?? 'NOT_STARTED', reviewId: commercialReview?.id ?? null },
                submissionDeadline: { value: tender.submissionDeadline ?? null, overdue: deadlinePassed },
                requiredTenderFields: { complete: missingFields.length === 0, missing: missingFields },
            },
        };
    }
    isReopen(from, to) {
        return (from === client_1.TenderStatus.TECHNICAL_REVIEW && to === client_1.TenderStatus.PREPARING)
            || (from === client_1.TenderStatus.COMMERCIAL_REVIEW && to === client_1.TenderStatus.TECHNICAL_REVIEW)
            || (from === client_1.TenderStatus.READY_FOR_SUBMISSION && to === client_1.TenderStatus.COMMERCIAL_REVIEW);
    }
    async getRequirement(tenderId, requirementId, organizationId) {
        const row = await this.prisma.tenderRequirement.findFirst({ where: { id: requirementId, tenderId, organizationId } });
        if (!row)
            throw new common_1.NotFoundException('Tender requirement not found');
        return row;
    }
    async assertRequirementIds(tenderId, ids, organizationId) {
        const unique = [...new Set(ids)];
        const count = await this.prisma.tenderRequirement.count({ where: { id: { in: unique }, tenderId, organizationId } });
        if (count !== unique.length)
            throw new common_1.BadRequestException({ code: 'REQUIREMENT_TENDER_MISMATCH', message: 'All requirements must belong to the same tender' });
    }
    async assertRequirementParent(tenderId, requirementId, parentId, organizationId) {
        if (requirementId && requirementId === parentId)
            throw new common_1.BadRequestException({ code: 'REQUIREMENT_SELF_PARENT', message: 'A requirement cannot be its own parent' });
        await this.assertRequirementIds(tenderId, [parentId], organizationId);
        if (!requirementId)
            return;
        const requirements = await this.prisma.tenderRequirement.findMany({ where: { tenderId, organizationId }, select: { id: true, parentRequirementId: true } });
        const parents = new Map(requirements.map((row) => [row.id, row.parentRequirementId]));
        let cursor = parentId;
        while (cursor) {
            if (cursor === requirementId)
                throw new common_1.BadRequestException({ code: 'REQUIREMENT_PARENT_CYCLE', message: 'Requirement hierarchy cannot contain a cycle' });
            cursor = parents.get(cursor);
        }
    }
    async assertNoDependencyCycle(tenderId, requirementId, dependencyId, organizationId) {
        if (requirementId === dependencyId)
            throw new common_1.BadRequestException({ code: 'REQUIREMENT_SELF_DEPENDENCY', message: 'A requirement cannot depend on itself' });
        const rows = await this.prisma.tenderRequirementDependency.findMany({
            where: { requirement: { tenderId, organizationId } },
            select: { requirementId: true, dependsOnRequirementId: true },
        });
        const graph = new Map();
        for (const row of rows)
            graph.set(row.requirementId, [...(graph.get(row.requirementId) ?? []), row.dependsOnRequirementId]);
        const seen = new Set();
        const stack = [dependencyId];
        while (stack.length) {
            const current = stack.pop();
            if (current === requirementId)
                throw new common_1.BadRequestException({ code: 'REQUIREMENT_DEPENDENCY_CYCLE', message: 'Requirement dependencies cannot contain a cycle' });
            if (seen.has(current))
                continue;
            seen.add(current);
            stack.push(...(graph.get(current) ?? []));
        }
    }
    async notifyTender(recipientId, user, tenderId, title, body, priority = client_1.NotificationPriority.NORMAL) {
        await this.notifications?.notifyUser({ recipientId, actorId: user.userId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), type: client_1.NotificationType.TENDER_WORKFLOW, priority, title, body, entityType: client_1.NotificationEntityType.TENDER, entityId: tenderId, actionUrl: `/technical/tenders/${tenderId}`, skipSelf: true });
    }
    async validateLinks(organizationId, input) {
        const dto = input;
        if (typeof dto.productId === 'string')
            await this.assertProduct(dto.productId);
        if (typeof dto.releaseId === 'string') {
            const release = await this.prisma.technicalRelease.findFirst({ where: { id: dto.releaseId, organizationId, archivedAt: null } });
            if (!release)
                throw new common_1.NotFoundException('Technical release not found');
            if (dto.productId && release.productId !== dto.productId)
                throw new common_1.BadRequestException('Release does not belong to the selected product');
        }
        if (typeof dto.companyId === 'string')
            await this.assertScoped('company', organizationId, dto.companyId);
        if (typeof dto.opportunityId === 'string')
            await this.assertScoped('opportunity', organizationId, dto.opportunityId);
        if (typeof dto.teamId === 'string')
            await this.assertScoped('team', organizationId, dto.teamId);
        for (const key of ['ownerId', 'reviewerId', 'technicalLeadId', 'commercialLeadId']) {
            if (typeof dto[key] === 'string')
                await this.assertUser(organizationId, dto[key]);
        }
        if (typeof dto.tenderId === 'string')
            await this.assertScoped('tender', organizationId, dto.tenderId);
    }
    async assertProduct(id) {
        if (!await this.prisma.productCatalogItem.findUnique({ where: { id }, select: { id: true } }))
            throw new common_1.NotFoundException('Product not found');
    }
    async assertReleaseVersionAvailable(organizationId, productId, version, excludeId) {
        const duplicate = await this.prisma.technicalRelease.findFirst({
            where: { organizationId, productId, version: version.trim(), ...(excludeId && { id: { not: excludeId } }) },
            select: { id: true },
        });
        if (duplicate)
            throw new common_1.ConflictException({
                code: 'DUPLICATE_RELEASE_VERSION',
                message: 'این شماره نسخه قبلاً برای محصول انتخاب‌شده ثبت شده است.',
            });
    }
    async assertKnowledgeSlugAvailable(organizationId, slug, excludeId) {
        const normalized = slug.trim().toLowerCase();
        const duplicate = await this.prisma.knowledgeBaseArticle.findFirst({
            where: {
                organizationId,
                slug: normalized,
                ...(excludeId && { id: { not: excludeId } }),
            },
            select: { id: true },
        });
        if (duplicate)
            throw new common_1.ConflictException({
                code: 'DUPLICATE_KNOWLEDGE_SLUG',
                message: 'این نامک قبلاً برای مقاله دیگری استفاده شده است.',
            });
    }
    async withResourceArtifactCounts(rows, organizationId) {
        if (!rows.length)
            return rows.map((row) => ({ ...row, artifactCount: 0 }));
        const counts = await this.prisma.fileAttachment.groupBy({
            by: ['entityId'],
            where: {
                organizationId,
                entityType: client_1.FileAttachmentEntityType.TECHNICAL_RESOURCE,
                entityId: { in: rows.map((row) => row.id) },
                deletedAt: null,
            },
            _count: { _all: true },
        });
        const byId = new Map(counts.map((entry) => [entry.entityId, entry._count._all]));
        return rows.map((row) => ({ ...row, artifactCount: byId.get(row.id) ?? 0 }));
    }
    assertResourceSource(resourceType, url) {
        if (resourceType === client_1.TechnicalResourceType.EXTERNAL_LINK && !url?.trim()) {
            throw new common_1.BadRequestException({
                code: 'TECHNICAL_RESOURCE_URL_REQUIRED',
                message: 'برای منبع از نوع پیوند خارجی، ثبت URL الزامی است.',
            });
        }
    }
    normalizeKnowledgeContent(dto, current) {
        const contentType = dto.contentType ?? current?.contentType ?? client_1.KnowledgeContentType.ARTICLE;
        const content = dto.content === undefined ? current?.content ?? null : this.nullableTrim(dto.content);
        const externalUrl = dto.externalUrl === undefined ? current?.externalUrl ?? null : this.nullableTrim(dto.externalUrl);
        if (contentType === client_1.KnowledgeContentType.ARTICLE && !content) {
            throw new common_1.BadRequestException({ code: 'KNOWLEDGE_CONTENT_REQUIRED', message: 'برای محتوای داخلی، متن مقاله الزامی است.' });
        }
        if (contentType === client_1.KnowledgeContentType.EXTERNAL_LINK && !externalUrl) {
            throw new common_1.BadRequestException({ code: 'KNOWLEDGE_EXTERNAL_URL_REQUIRED', message: 'برای محتوای لینک‌شده، آدرس منبع الزامی است.' });
        }
        return {
            contentType,
            content: contentType === client_1.KnowledgeContentType.ARTICLE ? content : null,
            externalUrl: contentType === client_1.KnowledgeContentType.EXTERNAL_LINK ? externalUrl : null,
        };
    }
    releaseSchedule(dto, current) {
        const schedule = {
            releaseDate: dto.releaseDate !== undefined ? this.date(dto.releaseDate, 'releaseDate') : current?.releaseDate,
            supportStartDate: dto.supportStartDate !== undefined ? this.date(dto.supportStartDate, 'supportStartDate') : current?.supportStartDate,
            supportEndDate: dto.supportEndDate !== undefined ? this.date(dto.supportEndDate, 'supportEndDate') : current?.supportEndDate,
            endOfLifeDate: dto.endOfLifeDate !== undefined ? this.date(dto.endOfLifeDate, 'endOfLifeDate') : current?.endOfLifeDate,
        };
        const ordered = [schedule.releaseDate, schedule.supportStartDate, schedule.supportEndDate, schedule.endOfLifeDate]
            .filter((value) => Boolean(value));
        if (ordered.some((value, index) => {
            const previous = ordered[index - 1];
            return previous !== undefined && value.getTime() < previous.getTime();
        })) {
            throw new common_1.BadRequestException({
                code: 'RELEASE_DATE_ORDER_INVALID',
                message: 'ترتیب تاریخ انتشار، شروع پشتیبانی، پایان پشتیبانی و پایان عمر معتبر نیست.',
            });
        }
        return schedule;
    }
    async assertScoped(model, organizationId, id) {
        const row = await this.prisma[model].findFirst({ where: { id, organizationId }, select: { id: true } });
        if (!row)
            throw new common_1.NotFoundException(`${model} not found`);
    }
    async assertUser(organizationId, userId) {
        const row = await this.prisma.organizationMembership.findFirst({ where: { organizationId, userId, status: 'ACTIVE' }, select: { id: true } });
        if (!row)
            throw new common_1.NotFoundException('Tenant user not found');
    }
    async assertAttachment(organizationId, id, entityType, entityId) {
        const row = await this.prisma.fileAttachment.findFirst({ where: { id, organizationId, entityType, entityId, deletedAt: null }, select: { id: true } });
        if (!row)
            throw new common_1.BadRequestException('Attachment is not linked to this technical entity');
    }
    async optimistic(model, id, organizationId, revision, data) {
        const result = await this.prisma[model].updateMany({ where: { id, organizationId, revision }, data: { ...data, revision: { increment: 1 } } });
        if (result.count !== 1)
            throw new common_1.ConflictException({ code: 'REVISION_CONFLICT', message: 'The record was changed by another request' });
    }
    require(user, permission) {
        if (!user.tenantContext?.permissions.includes(permission))
            throw new common_1.ForbiddenException(`Permission required: ${permission}`);
    }
    assertMutable(archivedAt) {
        if (archivedAt)
            throw new common_1.BadRequestException('Archived records cannot be changed');
    }
    assertTenderOpen(status) {
        const closed = [client_1.TenderStatus.WON, client_1.TenderStatus.LOST, client_1.TenderStatus.CANCELLED, client_1.TenderStatus.ARCHIVED];
        if (closed.includes(status))
            throw new common_1.BadRequestException('Closed tenders cannot be changed');
    }
    enumValue(values, value, field) {
        if (!Object.values(values).includes(value))
            throw new common_1.BadRequestException(`${field} is invalid`);
        return value;
    }
    date(value, field) { return value === undefined ? undefined : (0, api_date_util_1.parseApiDate)(value, field); }
    nullableDate(value, field) { return value === null ? null : this.date(value, field); }
    nullableTrim(value) { return value === null ? null : value?.trim(); }
    range(query) { return (0, api_date_util_1.parseApiDateRange)(query.from, query.to, 'from', 'to'); }
    skip(query) { return ((query.page ?? 1) - 1) * (query.limit ?? 20); }
    sort(query, allowed, fallback) {
        const field = query.sort ?? fallback;
        if (!allowed.includes(field))
            throw new common_1.BadRequestException(`sort must be one of: ${allowed.join(', ')}`);
        return { [field]: query.sortDirection ?? 'desc' };
    }
    async page(query, rows, count) {
        const [data, total] = await Promise.all([rows(), count()]);
        const page = query.page ?? 1, limit = query.limit ?? 20, totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    log(entityType, entityId, action, organizationId, user, before, after, reason) {
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
    auditSnapshot(value) {
        if (!value || typeof value !== 'object')
            return value;
        const row = value;
        const keys = ['id', 'organizationId', 'productId', 'releaseId', 'documentId', 'tenderId', 'companyId', 'opportunityId', 'ownerId', 'taskId', 'parentRequirementId', 'referenceId', 'dependencyIds', 'title', 'slug', 'version', 'status', 'resourceType', 'tenderType', 'result', 'bidDecision', 'qualificationDecision', 'fitScore', 'riskScore', 'feasibilityScore', 'fitNotes', 'riskNotes', 'feasibilityNotes', 'qualificationSummary', 'qualificationConditions', 'decisionReason', 'revision', 'archivedAt', 'updatedAt'];
        return Object.fromEntries(keys.filter((key) => row[key] !== undefined).map((key) => [key, row[key]]));
    }
};
exports.TechnicalCenterService = TechnicalCenterService;
exports.TechnicalCenterService = TechnicalCenterService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        notifications_service_1.NotificationsService,
        tasks_service_1.TasksService])
], TechnicalCenterService);
//# sourceMappingURL=technical-center.service.js.map