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
exports.ArtifactsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const attachments_service_1 = require("../attachments/attachments.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const artifactInclude = {
    uploadedBy: { select: { id: true, fullName: true, email: true } },
    links: { orderBy: { createdAt: 'desc' } },
    _count: { select: { links: true } },
};
let ArtifactsService = class ArtifactsService {
    constructor(prisma, attachments, audit) {
        this.prisma = prisma;
        this.attachments = attachments;
        this.audit = audit;
    }
    async findAll(query, user) {
        if (!query.entityType || !query.entityId)
            throw new common_1.BadRequestException('entityType and entityId are required');
        await this.attachments.assertEntityAccess(query.entityType, query.entityId, user);
        const page = query.page ?? 1, limit = query.limit ?? 20;
        const search = query.search?.trim();
        const where = {
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), deletedAt: null,
            type: query.type, provider: query.provider,
            ...(search && { OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { originalFileName: { contains: search, mode: 'insensitive' } },
                ] }),
            ...(query.createdFrom || query.createdTo ? { createdAt: { gte: query.createdFrom ? new Date(query.createdFrom) : undefined, lte: query.createdTo ? new Date(query.createdTo) : undefined } } : {}),
            ...((query.entityType && query.entityId) || query.relationType ? { links: { some: {
                        entityType: query.entityType, entityId: query.entityId, relationType: query.relationType,
                    } } } : {}),
        };
        const [data, total] = await Promise.all([
            this.prisma.fileAttachment.findMany({ where, include: artifactInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.fileAttachment.count({ where }),
        ]);
        return { data, meta: this.meta(total, page, limit) };
    }
    async findOne(id, user) {
        const artifact = await this.prisma.fileAttachment.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), deletedAt: null }, include: artifactInclude,
        });
        if (!artifact)
            throw new common_1.NotFoundException('Artifact not found');
        if (artifact.links[0])
            await this.attachments.assertEntityAccess(artifact.links[0].entityType, artifact.links[0].entityId, user);
        return artifact;
    }
    async upload(dto, file, user) {
        const created = await this.attachments.upload(dto, file, user);
        if (dto.category || dto.tags || dto.versionLabel || dto.confidentiality) {
            await this.prisma.fileAttachment.update({ where: { id: created.id }, data: {
                    category: dto.category?.trim(), tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean),
                    versionLabel: dto.versionLabel?.trim(), confidentiality: dto.confidentiality?.trim(),
                } });
        }
        await this.audit.record({
            actorId: user.userId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), entityType: 'artifact', entityId: created.id,
            action: 'artifact.uploaded', after: { id: created.id, name: created.name, type: client_1.ArtifactType.FILE, provider: created.provider, sha256: created.sha256 },
        });
        return this.findOne(created.id, user);
    }
    async createExternal(dto, user) {
        if (dto.provider === client_1.ArtifactProvider.LOCAL || dto.provider === client_1.ArtifactProvider.OBJECT_STORAGE)
            throw new common_1.BadRequestException('External artifacts require an external provider');
        await this.attachments.assertEntityAccess(dto.entityType, dto.entityId, user, true);
        const externalUrl = this.normalizeExternalUrl(dto.externalUrl);
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const artifact = await this.prisma.$transaction(async (tx) => {
            const created = await tx.fileAttachment.create({ data: {
                    organizationId, entityType: dto.entityType, entityId: dto.entityId,
                    type: client_1.ArtifactType.EXTERNAL_URL, provider: dto.provider,
                    name: this.requiredName(dto.name), externalUrl,
                    description: dto.description?.trim(), metadata: dto.metadata,
                    category: dto.category?.trim(), tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
                    versionLabel: dto.versionLabel?.trim(), confidentiality: dto.confidentiality?.trim(),
                    storageProvider: 'LOCAL', uploadedById: user.userId,
                } });
            await tx.artifactLink.create({ data: {
                    organizationId, artifactId: created.id, entityType: dto.entityType, entityId: dto.entityId,
                    relationType: dto.relationType ?? client_1.ArtifactRelationType.REFERENCE, createdById: user.userId,
                } });
            return created;
        });
        await this.audit.record({
            actorId: user.userId, organizationId, entityType: 'artifact', entityId: artifact.id,
            action: 'artifact.external_created', after: { id: artifact.id, name: artifact.name, type: artifact.type, provider: artifact.provider, externalUrl },
        });
        return this.findOne(artifact.id, user);
    }
    async update(id, dto, user) {
        const before = await this.findOne(id, user);
        if (before.links[0])
            await this.attachments.assertEntityAccess(before.links[0].entityType, before.links[0].entityId, user, true);
        const updated = await this.prisma.fileAttachment.update({ where: { id }, data: {
                name: dto.name !== undefined ? this.requiredName(dto.name) : undefined,
                description: dto.description !== undefined ? dto.description.trim() || null : undefined,
                category: dto.category !== undefined ? dto.category.trim() || null : undefined,
                tags: dto.tags?.map((tag) => tag.trim()).filter(Boolean),
                versionLabel: dto.versionLabel !== undefined ? dto.versionLabel.trim() || null : undefined,
                confidentiality: dto.confidentiality !== undefined ? dto.confidentiality.trim() || null : undefined,
                metadata: dto.metadata,
            }, include: artifactInclude });
        await this.audit.record({ actorId: user.userId, organizationId: before.organizationId, entityType: 'artifact', entityId: id, action: 'artifact.updated', before, after: updated });
        return updated;
    }
    async links(id, user) {
        await this.findOne(id, user);
        return this.prisma.artifactLink.findMany({ where: { artifactId: id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) }, orderBy: { createdAt: 'desc' } });
    }
    async link(id, dto, user) {
        const artifact = await this.findOne(id, user);
        await this.attachments.assertEntityAccess(dto.entityType, dto.entityId, user, true);
        const relationType = dto.relationType ?? client_1.ArtifactRelationType.ATTACHMENT;
        try {
            const link = await this.prisma.artifactLink.create({ data: {
                    organizationId: artifact.organizationId, artifactId: id, entityType: dto.entityType,
                    entityId: dto.entityId, relationType, createdById: user.userId,
                } });
            await this.audit.record({ actorId: user.userId, organizationId: artifact.organizationId, entityType: 'artifact', entityId: id, action: 'artifact.linked', metadata: { entityType: dto.entityType, entityId: dto.entityId, relationType } });
            return link;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
                throw new common_1.ConflictException('Artifact is already linked to this entity with the same relation');
            throw error;
        }
    }
    async unlink(id, linkId, user) {
        const artifact = await this.findOne(id, user);
        const link = await this.prisma.artifactLink.findFirst({ where: { id: linkId, artifactId: id, organizationId: artifact.organizationId } });
        if (!link)
            throw new common_1.NotFoundException('Artifact link not found');
        await this.attachments.assertEntityAccess(link.entityType, link.entityId, user, true);
        await this.prisma.artifactLink.delete({ where: { id: linkId } });
        await this.audit.record({ actorId: user.userId, organizationId: artifact.organizationId, entityType: 'artifact', entityId: id, action: 'artifact.unlinked', metadata: { entityType: link.entityType, entityId: link.entityId, relationType: link.relationType } });
        return { deleted: true };
    }
    async remove(id, user) {
        const artifact = await this.findOne(id, user);
        const deleted = await this.attachments.remove(id, user);
        await this.audit.record({ actorId: user.userId, organizationId: artifact.organizationId, entityType: 'artifact', entityId: id, action: 'artifact.deleted', before: { id, name: artifact.name, type: artifact.type, provider: artifact.provider } });
        return deleted;
    }
    normalizeExternalUrl(value) {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol))
            throw new common_1.BadRequestException('Only HTTP/HTTPS artifact URLs are allowed');
        url.hash = '';
        return url.toString();
    }
    requiredName(value) {
        const name = value.trim();
        if (!name)
            throw new common_1.BadRequestException('Artifact name is required');
        return name;
    }
    meta(total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 };
    }
};
exports.ArtifactsService = ArtifactsService;
exports.ArtifactsService = ArtifactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        attachments_service_1.AttachmentsService,
        audit_log_service_1.AuditLogService])
], ArtifactsService);
//# sourceMappingURL=artifacts.service.js.map