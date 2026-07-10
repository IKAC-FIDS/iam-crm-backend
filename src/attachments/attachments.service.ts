import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FileAttachment,
  FileAttachmentEntityType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { FindAttachmentsDto } from './dto/find-attachments.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import {
  ATTACHMENT_STORAGE,
  AttachmentStorageService,
} from './storage/attachment-storage.types';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
    @Inject(ATTACHMENT_STORAGE)
    private readonly storage: AttachmentStorageService,
  ) {}

  async findAll(query: FindAttachmentsDto, user: CurrentUserPayload) {
    await this.assertEntityAccess(query.entityType, query.entityId, user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.FileAttachmentWhereInput = {
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

  async findOne(id: string, user: CurrentUserPayload) {
    const attachment = await this.getActiveAttachment(id);

    await this.assertEntityAccess(
      attachment.entityType,
      attachment.entityId,
      user,
    );

    return attachment;
  }

  async upload(
    dto: UploadAttachmentDto,
    file: Express.Multer.File | undefined,
    user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('فایل الزامی است');
    }

    await this.assertEntityAccess(dto.entityType, dto.entityId, user, true);

    this.validateFile(file);

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const originalFileName = this.sanitizeFileName(file.originalname);
    const extension = this.safeExtension(originalFileName);
    const storedFileName = `${randomUUID()}${extension}`;
    const relativeDirectory = join(year, month);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');

    const stored = await this.storage.save({
      buffer: file.buffer,
      storedFileName,
      relativeDirectory,
      mimeType: file.mimetype,
    });

    const attachment = await this.prisma.fileAttachment.create({
      data: {
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

  async getDownloadStream(id: string, user: CurrentUserPayload) {
    const attachment = await this.getActiveAttachment(id);

    await this.assertEntityAccess(
      attachment.entityType,
      attachment.entityId,
      user,
    );

    const stream = await this.storage.getStream(
      attachment.objectKey,
      attachment.storagePath,
    );

    await this.audit.record({
      actorId: user.userId,
      entityType: 'file-attachment',
      entityId: attachment.id,
      action: 'attachment.downloaded',
      metadata: {
        attachedToEntityType: attachment.entityType,
        attachedToEntityId: attachment.entityId,
        originalFileName: attachment.originalFileName,
        storageProvider: attachment.storageProvider,
        bucket: attachment.bucket,
        objectKey: attachment.objectKey,
      },
    });

    return {
      attachment,
      stream,
    };
  }

  async remove(id: string, user: CurrentUserPayload) {
    const attachment = await this.getActiveAttachment(id);

    await this.assertEntityAccess(
      attachment.entityType,
      attachment.entityId,
      user,
      true,
    );

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
        storageProvider: attachment.storageProvider,
        bucket: attachment.bucket,
        objectKey: attachment.objectKey,
      },
    });

    return deleted;
  }

  private async getActiveAttachment(id: string): Promise<FileAttachment> {
    const attachment = await this.prisma.fileAttachment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!attachment) {
      throw new NotFoundException('فایل پیوست پیدا نشد');
    }

    return attachment;
  }

  private validateFile(file: Express.Multer.File) {
    const maxSize = this.config.get<number>(
      'MAX_ATTACHMENT_SIZE_BYTES',
      26214400,
    );

    if (file.size > maxSize) {
      throw new BadRequestException(
        `حجم فایل بیشتر از حد مجاز است. حداکثر مجاز: ${maxSize} بایت`,
      );
    }

    const allowedMimeTypes = this.getAllowedMimeTypes();

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('نوع فایل مجاز نیست');
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('فایل خالی است');
    }
  }

  private getAllowedMimeTypes() {
    return this.config
      .get<string>(
        'ALLOWED_ATTACHMENT_MIME_TYPES',
        'application/pdf,image/jpeg,image/png,image/webp,text/plain,text/csv',
      )
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private sanitizeFileName(fileName: string) {
    const cleanName = basename(fileName)
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .trim();

    return cleanName || 'attachment.bin';
  }

  private safeExtension(fileName: string) {
    const extension = extname(fileName).toLowerCase();

    if (!extension || extension.length > 20) {
      return '.bin';
    }

    return extension.replace(/[^a-z0-9.]/g, '') || '.bin';
  }

  private async assertEntityAccess(
    entityType: FileAttachmentEntityType,
    entityId: string,
    user: CurrentUserPayload,
    mutation = false,
  ) {
    if (mutation && user.role === UserRole.BOARDS) {
      throw new ForbiddenException('Attachments are read-only for this role');
    }

    if (entityType === FileAttachmentEntityType.OPPORTUNITY) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: {
          AND: [
            { id: entityId },
            this.opportunityScopeWhere(user),
          ],
        },
      });

      if (!opportunity) {
        throw new NotFoundException('Opportunity not found');
      }

      if (mutation && opportunity.archivedAt) {
        throw new BadRequestException(
          'Archived opportunities cannot be changed',
        );
      }

      return;
    }

    if (entityType === FileAttachmentEntityType.COMMERCIAL_DOCUMENT) {
      const document = await this.prisma.opportunityCommercialDocument.findFirst({
        where: {
          id: entityId,
          opportunity: this.opportunityScopeWhere(user),
        },
        include: {
          opportunity: true,
        },
      });

      if (!document) {
        throw new NotFoundException('Commercial document not found');
      }

      if (mutation && document.opportunity.archivedAt) {
        throw new BadRequestException(
          'Archived opportunities cannot be changed',
        );
      }

      return;
    }

    if (entityType === FileAttachmentEntityType.PAYMENT) {
      const payment = await this.prisma.opportunityPayment.findFirst({
        where: {
          id: entityId,
          opportunity: this.opportunityScopeWhere(user),
        },
        include: {
          opportunity: true,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (mutation && payment.opportunity.archivedAt) {
        throw new BadRequestException(
          'Archived opportunities cannot be changed',
        );
      }

      return;
    }

    throw new BadRequestException('Unsupported attachment entity type');
  }

  private opportunityScopeWhere(
    user: CurrentUserPayload,
  ): Prisma.OpportunityWhereInput {
    if (user.role === UserRole.ADMIN || user.role === UserRole.BOARDS) {
      return {};
    }

    if (user.role === UserRole.MANAGER) {
      return user.team
        ? {
            company: {
              owner: {
                team: user.team,
              },
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
}