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
var AttachmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const attachment_storage_types_1 = require("./storage/attachment-storage.types");
let AttachmentsService = AttachmentsService_1 = class AttachmentsService {
    constructor(prisma, config, audit, storage) {
        this.prisma = prisma;
        this.config = config;
        this.audit = audit;
        this.storage = storage;
        this.logger = new common_1.Logger(AttachmentsService_1.name);
    }
    async findAll(query, user) {
        await this.assertEntityAccess(query.entityType, query.entityId, user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: query.entityType,
            entityId: query.entityId,
            deletedAt: null,
        };
        const [data, total] = await Promise.all([
            this.prisma.fileAttachment.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.fileAttachment.count({ where }),
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
    async findOne(id, user) {
        const attachment = await this.getActiveAttachment(id, user);
        await this.assertEntityAccess(attachment.entityType, attachment.entityId, user);
        return attachment;
    }
    async upload(dto, file, user) {
        if (!file) {
            throw new common_1.BadRequestException('فایل الزامی است');
        }
        await this.assertEntityAccess(dto.entityType, dto.entityId, user, true);
        this.validateFile(file);
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const originalFileName = this.sanitizeFileName(file.originalname);
        const extension = this.safeExtension(originalFileName);
        const storedFileName = `${(0, node_crypto_1.randomUUID)()}${extension}`;
        const relativeDirectory = (0, node_path_1.join)(year, month);
        const sha256 = (0, node_crypto_1.createHash)('sha256').update(file.buffer).digest('hex');
        const stored = await this.storage.save({
            buffer: file.buffer,
            storedFileName,
            relativeDirectory,
            mimeType: file.mimetype,
        });
        const attachment = await this.prisma.fileAttachment.create({
            data: {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                entityType: dto.entityType,
                entityId: dto.entityId,
                storageProvider: stored.storageProvider,
                bucket: stored.bucket,
                objectKey: stored.objectKey,
                storagePath: stored.storagePath,
                originalFileName,
                storedFileName,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                sha256,
                description: dto.description?.trim() || undefined,
                uploadedById: user.userId,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'file-attachment',
            entityId: attachment.id,
            action: 'attachment.uploaded',
            after: attachment,
            metadata: {
                attachedToEntityType: dto.entityType,
                attachedToEntityId: dto.entityId,
                originalFileName,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storageProvider: stored.storageProvider,
                bucket: stored.bucket,
                objectKey: stored.objectKey,
            },
        });
        return attachment;
    }
    async getDownloadStream(id, user) {
        const attachment = await this.getActiveAttachment(id, user);
        await this.assertEntityAccess(attachment.entityType, attachment.entityId, user);
        if (!attachment.objectKey) {
            throw new common_1.BadRequestException('Attachment does not have a stored file available for download');
        }
        const stream = await this.storage.getStream(attachment.objectKey, attachment.storagePath, attachment.bucket);
        await this.recordDownloadAudit(attachment, user);
        return {
            attachment,
            stream,
        };
    }
    async remove(id, user) {
        const attachment = await this.getActiveAttachment(id, user);
        await this.assertEntityAccess(attachment.entityType, attachment.entityId, user, true);
        const deleted = await this.prisma.fileAttachment.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedById: user.userId,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'file-attachment',
            entityId: attachment.id,
            action: 'attachment.deleted',
            before: attachment,
            after: deleted,
            metadata: {
                attachedToEntityType: attachment.entityType,
                attachedToEntityId: attachment.entityId,
                originalFileName: attachment.originalFileName,
                mimeType: attachment.mimeType,
                sizeBytes: attachment.sizeBytes,
                storageProvider: attachment.storageProvider,
                bucket: attachment.bucket,
                objectKey: attachment.objectKey,
            },
        });
        return deleted;
    }
    async getActiveAttachment(id, user) {
        const attachment = await this.prisma.fileAttachment.findFirst({
            where: {
                id,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                deletedAt: null,
            },
        });
        if (!attachment) {
            throw new common_1.NotFoundException('فایل پیوست پیدا نشد');
        }
        return attachment;
    }
    validateFile(file) {
        const maxSize = this.config.get('MAX_ATTACHMENT_SIZE_BYTES', 26214400);
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`حجم فایل بیشتر از حد مجاز است. حداکثر مجاز: ${maxSize} بایت`);
        }
        const allowedMimeTypes = this.getAllowedMimeTypes();
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('نوع فایل مجاز نیست');
        }
        if (!file.buffer?.length) {
            throw new common_1.BadRequestException('فایل خالی است');
        }
    }
    async recordDownloadAudit(attachment, user) {
        try {
            await this.audit.record({
                actorId: user.userId,
                entityType: 'file-attachment',
                entityId: attachment.id,
                action: 'attachment.downloaded',
                metadata: {
                    attachedToEntityType: attachment.entityType,
                    attachedToEntityId: attachment.entityId,
                    originalFileName: attachment.originalFileName,
                    mimeType: attachment.mimeType,
                    sizeBytes: attachment.sizeBytes,
                    storageProvider: attachment.storageProvider,
                    bucket: attachment.bucket,
                    objectKey: attachment.objectKey,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to record download audit for attachment ${attachment.id}`, error instanceof Error ? error.stack : String(error));
        }
    }
    getAllowedMimeTypes() {
        return this.config
            .get('ALLOWED_ATTACHMENT_MIME_TYPES', [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/webp',
            'text/plain',
            'text/csv',
        ].join(','))
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    sanitizeFileName(fileName) {
        const unsafeCharacters = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
        const cleanName = Array.from((0, node_path_1.basename)(fileName))
            .map((char) => unsafeCharacters.has(char) || char.charCodeAt(0) < 32 ? '_' : char)
            .join('')
            .trim();
        return cleanName || 'attachment.bin';
    }
    safeExtension(fileName) {
        const extension = (0, node_path_1.extname)(fileName).toLowerCase();
        if (!extension || extension.length > 20) {
            return '.bin';
        }
        return extension.replace(/[^a-z0-9.]/g, '') || '.bin';
    }
    async assertEntityAccess(entityType, entityId, user, mutation = false) {
        if (mutation && user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Attachments are read-only for this role');
        }
        if (entityType === client_1.FileAttachmentEntityType.OPPORTUNITY) {
            const opportunity = await this.prisma.opportunity.findFirst({
                where: {
                    AND: [
                        { id: entityId },
                        { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                        this.opportunityScopeWhere(user),
                    ],
                },
            });
            if (!opportunity) {
                throw new common_1.NotFoundException('Opportunity not found');
            }
            if (mutation && opportunity.archivedAt) {
                throw new common_1.BadRequestException('Archived opportunities cannot be changed');
            }
            return;
        }
        if (entityType === client_1.FileAttachmentEntityType.COMMERCIAL_DOCUMENT) {
            const document = await this.prisma.opportunityCommercialDocument.findFirst({
                where: {
                    id: entityId,
                    opportunity: {
                        AND: [
                            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                            this.opportunityScopeWhere(user),
                        ],
                    },
                },
                include: {
                    opportunity: true,
                },
            });
            if (!document) {
                throw new common_1.NotFoundException('Commercial document not found');
            }
            if (mutation && document.opportunity.archivedAt) {
                throw new common_1.BadRequestException('Archived opportunities cannot be changed');
            }
            return;
        }
        if (entityType === client_1.FileAttachmentEntityType.PAYMENT) {
            const payment = await this.prisma.opportunityPayment.findFirst({
                where: {
                    id: entityId,
                    opportunity: {
                        AND: [
                            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                            this.opportunityScopeWhere(user),
                        ],
                    },
                },
                include: {
                    opportunity: true,
                },
            });
            if (!payment) {
                throw new common_1.NotFoundException('Payment not found');
            }
            if (mutation && payment.opportunity.archivedAt) {
                throw new common_1.BadRequestException('Archived opportunities cannot be changed');
            }
            return;
        }
        if (entityType === client_1.FileAttachmentEntityType.COMPANY_LEGAL_DOCUMENT) {
            const document = await this.prisma.companyLegalDocument.findFirst({
                where: {
                    id: entityId,
                    company: {
                        organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                        archivedAt: null,
                    },
                },
            });
            if (!document) {
                throw new common_1.NotFoundException('Company legal document not found');
            }
            return;
        }
        if (entityType === client_1.FileAttachmentEntityType.MEETING) {
            const meeting = await this.prisma.meeting.findFirst({
                where: {
                    id: entityId,
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                },
                select: {
                    status: true,
                },
            });
            if (!meeting) {
                throw new common_1.NotFoundException('Meeting not found');
            }
            if (mutation && meeting.status !== client_1.MeetingStatus.COMPLETED) {
                throw new common_1.BadRequestException('بارگذاری مستندات فقط برای جلسات برگزارشده امکان‌پذیر است.');
            }
            return;
        }
        throw new common_1.BadRequestException('Unsupported attachment entity type');
    }
    opportunityScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
            return user.teamId || user.team
                ? {
                    company: {
                        owner: (0, team_scope_util_1.userTeamScopeWhere)(user),
                    },
                }
                : {
                    id: {
                        in: [],
                    },
                };
        }
        return {
            OR: [
                {
                    ownerId: user.userId,
                },
                {
                    company: {
                        ownerId: user.userId,
                    },
                },
            ],
        };
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = AttachmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(attachment_storage_types_1.ATTACHMENT_STORAGE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_log_service_1.AuditLogService, Object])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map