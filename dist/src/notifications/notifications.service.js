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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const notificationInclude = {
    recipient: {
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            team: true,
        },
    },
    actor: {
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            team: true,
        },
    },
};
let NotificationsService = class NotificationsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(query, user) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = this.buildWhere(query, user);
        const [data, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                include: notificationInclude,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
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
    async unreadCount(user) {
        const total = await this.prisma.notification.count({
            where: {
                recipientId: user.userId,
                readAt: null,
                archivedAt: null,
            },
        });
        return {
            total,
        };
    }
    async findOne(id, user) {
        return this.getNotificationInScope(id, user);
    }
    async create(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Notifications are read-only for this role');
        }
        const recipients = await this.validateRecipients(dto.recipientIds, user);
        const notifications = await Promise.all(recipients.map((recipient) => this.prisma.notification.create({
            data: {
                recipientId: recipient.id,
                actorId: user.userId,
                type: dto.type,
                priority: dto.priority ?? client_1.NotificationPriority.NORMAL,
                title: this.requiredText(dto.title, 'عنوان اعلان الزامی است'),
                body: dto.body?.trim() || undefined,
                entityType: dto.entityType,
                entityId: dto.entityId?.trim() || undefined,
                actionUrl: dto.actionUrl?.trim() || undefined,
                metadata: dto.metadata,
            },
            include: notificationInclude,
        })));
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            action: 'notification.created',
            after: notifications,
            metadata: {
                recipientCount: notifications.length,
                type: dto.type,
                entityType: dto.entityType,
                entityId: dto.entityId,
            },
        });
        return {
            data: notifications,
            meta: {
                total: notifications.length,
            },
        };
    }
    async markRead(id, user) {
        const current = await this.getNotificationInScope(id, user);
        if (current.readAt) {
            return current;
        }
        const updated = await this.prisma.notification.update({
            where: { id },
            data: {
                readAt: new Date(),
            },
            include: notificationInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            entityId: id,
            action: 'notification.read',
            before: {
                readAt: current.readAt,
            },
            after: {
                readAt: updated.readAt,
            },
        });
        return updated;
    }
    async markUnread(id, user) {
        const current = await this.getNotificationInScope(id, user);
        const updated = await this.prisma.notification.update({
            where: { id },
            data: {
                readAt: null,
            },
            include: notificationInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            entityId: id,
            action: 'notification.unread',
            before: {
                readAt: current.readAt,
            },
            after: {
                readAt: updated.readAt,
            },
        });
        return updated;
    }
    async readAll(dto, user) {
        const where = {
            recipientId: user.userId,
            readAt: null,
            archivedAt: null,
            ...(dto.type && { type: dto.type }),
            ...(dto.entityType && { entityType: dto.entityType }),
            ...(dto.entityId && { entityId: dto.entityId }),
        };
        const result = await this.prisma.notification.updateMany({
            where,
            data: {
                readAt: new Date(),
            },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            action: 'notification.read_all',
            metadata: {
                updatedCount: result.count,
                type: dto.type,
                entityType: dto.entityType,
                entityId: dto.entityId,
            },
        });
        return {
            updatedCount: result.count,
        };
    }
    async archive(id, user) {
        const current = await this.getNotificationInScope(id, user);
        const updated = await this.prisma.notification.update({
            where: { id },
            data: {
                archivedAt: new Date(),
            },
            include: notificationInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            entityId: id,
            action: 'notification.archived',
            before: {
                archivedAt: current.archivedAt,
            },
            after: {
                archivedAt: updated.archivedAt,
            },
        });
        return updated;
    }
    async unarchive(id, user) {
        const current = await this.getNotificationInScope(id, user);
        const updated = await this.prisma.notification.update({
            where: { id },
            data: {
                archivedAt: null,
            },
            include: notificationInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            entityId: id,
            action: 'notification.unarchived',
            before: {
                archivedAt: current.archivedAt,
            },
            after: {
                archivedAt: updated.archivedAt,
            },
        });
        return updated;
    }
    async remove(id, user) {
        const current = await this.getNotificationInScope(id, user);
        const deleted = await this.prisma.notification.delete({
            where: { id },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'notification',
            entityId: id,
            action: 'notification.deleted',
            before: current,
        });
        return deleted;
    }
    async notifyUser(input) {
        if (input.skipSelf && input.actorId && input.actorId === input.recipientId) {
            return null;
        }
        const recipient = await this.prisma.user.findUnique({
            where: {
                id: input.recipientId,
            },
            select: {
                id: true,
                isActive: true,
            },
        });
        if (!recipient?.isActive) {
            return null;
        }
        return this.prisma.notification.create({
            data: {
                recipientId: input.recipientId,
                actorId: input.actorId ?? undefined,
                type: input.type,
                priority: input.priority ?? client_1.NotificationPriority.NORMAL,
                title: this.requiredText(input.title, 'عنوان اعلان الزامی است'),
                body: input.body?.trim() || undefined,
                entityType: input.entityType ?? undefined,
                entityId: input.entityId ?? undefined,
                actionUrl: input.actionUrl ?? undefined,
                metadata: input.metadata,
            },
        });
    }
    buildWhere(query, user) {
        const and = [
            {
                recipientId: user.userId,
            },
        ];
        if (query.type) {
            and.push({
                type: query.type,
            });
        }
        if (query.priority) {
            and.push({
                priority: query.priority,
            });
        }
        if (query.entityType) {
            and.push({
                entityType: query.entityType,
            });
        }
        if (query.entityId?.trim()) {
            and.push({
                entityId: query.entityId.trim(),
            });
        }
        if (query.status === 'unread') {
            and.push({
                readAt: null,
            });
        }
        if (query.status === 'read') {
            and.push({
                readAt: {
                    not: null,
                },
            });
        }
        if (query.archivedOnly === 'true') {
            and.push({
                archivedAt: {
                    not: null,
                },
            });
        }
        else if (query.includeArchived !== 'true') {
            and.push({
                archivedAt: null,
            });
        }
        const search = query.search?.trim();
        if (search) {
            and.push({
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        body: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ],
            });
        }
        return {
            AND: and,
        };
    }
    async getNotificationInScope(id, user) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id,
                recipientId: user.userId,
            },
            include: notificationInclude,
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        return notification;
    }
    async validateRecipients(recipientIds, user) {
        const uniqueIds = Array.from(new Set(recipientIds));
        if (!uniqueIds.length) {
            throw new common_1.BadRequestException('حداقل یک گیرنده اعلان الزامی است');
        }
        const recipients = await this.prisma.user.findMany({
            where: {
                id: {
                    in: uniqueIds,
                },
                isActive: true,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
            },
        });
        if (recipients.length !== uniqueIds.length) {
            throw new common_1.BadRequestException('یک یا چند گیرنده اعلان معتبر نیستند');
        }
        if (user.role === client_1.UserRole.ADMIN) {
            return recipients;
        }
        if (user.role === client_1.UserRole.MANAGER) {
            const invalidRecipient = recipients.find((recipient) => !user.team || recipient.team !== user.team);
            if (invalidRecipient) {
                throw new common_1.ForbiddenException('MANAGER can only send notifications to own team');
            }
            return recipients;
        }
        const invalidRecipient = recipients.find((recipient) => recipient.id !== user.userId);
        if (invalidRecipient) {
            throw new common_1.ForbiddenException('REP can only send notifications to self');
        }
        return recipients;
    }
    requiredText(value, message) {
        const normalized = value.trim();
        if (!normalized) {
            throw new common_1.BadRequestException(message);
        }
        return normalized;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map