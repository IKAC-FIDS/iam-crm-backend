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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const taskInclude = {
    company: {
        select: {
            id: true,
            legalName: true,
            brandName: true,
            ownerId: true,
        },
    },
    person: {
        select: {
            id: true,
            fullName: true,
            title: true,
            companyId: true,
        },
    },
    opportunity: {
        select: {
            id: true,
            title: true,
            companyId: true,
            ownerId: true,
            priority: true,
        },
    },
    commercialDocument: {
        select: {
            id: true,
            type: true,
            status: true,
            number: true,
            title: true,
            opportunityId: true,
        },
    },
    payment: {
        select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            dueDate: true,
            opportunityId: true,
        },
    },
    assignedTo: {
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            team: true,
        },
    },
    createdBy: {
        select: {
            id: true,
            fullName: true,
            email: true,
        },
    },
    completedBy: {
        select: {
            id: true,
            fullName: true,
            email: true,
        },
    },
};
let TasksService = class TasksService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    async findAll(query, user) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = this.buildWhere(query, user);
        const [data, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                include: taskInclude,
                orderBy: [
                    { dueAt: 'asc' },
                    { createdAt: 'desc' },
                ],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.task.count({ where }),
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
        const task = await this.getTaskInScope(id, user);
        return task;
    }
    async create(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Tasks are read-only for this role');
        }
        await this.validateLinkedEntities(dto, user);
        const assignedToId = dto.assignedToId ?? user.userId;
        if (assignedToId) {
            await this.validateAssignee(assignedToId, user);
        }
        const status = dto.status ?? client_1.TaskStatus.TODO;
        const now = new Date();
        const task = await this.prisma.task.create({
            data: {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                title: this.requiredText(dto.title, 'عنوان کار الزامی است'),
                description: dto.description?.trim() || undefined,
                status,
                priority: dto.priority,
                dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
                reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
                companyId: dto.companyId,
                personId: dto.personId,
                opportunityId: dto.opportunityId,
                commercialDocumentId: dto.commercialDocumentId,
                paymentId: dto.paymentId,
                assignedToId,
                createdById: user.userId,
                completedAt: status === client_1.TaskStatus.DONE ? now : undefined,
                completedById: status === client_1.TaskStatus.DONE ? user.userId : undefined,
                cancelledAt: status === client_1.TaskStatus.CANCELLED ? now : undefined,
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: task.id,
            action: 'task.created',
            after: task,
        });
        await this.notifyTaskAssigned(task, user);
        return task;
    }
    async update(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        await this.validateLinkedEntities(dto, user);
        const data = {};
        if (dto.title !== undefined) {
            data.title = this.requiredText(dto.title, 'عنوان کار الزامی است');
        }
        if (dto.description !== undefined) {
            data.description = dto.description?.trim() || null;
        }
        if (dto.status !== undefined) {
            Object.assign(data, this.buildStatusUpdate(dto.status, user));
        }
        if (dto.priority !== undefined) {
            data.priority = dto.priority;
        }
        if (dto.dueAt !== undefined) {
            data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
        }
        if (dto.reminderAt !== undefined) {
            data.reminderAt = dto.reminderAt ? new Date(dto.reminderAt) : null;
        }
        if (dto.companyId !== undefined) {
            data.company = dto.companyId
                ? { connect: { id: dto.companyId } }
                : { disconnect: true };
        }
        if (dto.personId !== undefined) {
            data.person = dto.personId
                ? { connect: { id: dto.personId } }
                : { disconnect: true };
        }
        if (dto.opportunityId !== undefined) {
            data.opportunity = dto.opportunityId
                ? { connect: { id: dto.opportunityId } }
                : { disconnect: true };
        }
        if (dto.commercialDocumentId !== undefined) {
            data.commercialDocument = dto.commercialDocumentId
                ? { connect: { id: dto.commercialDocumentId } }
                : { disconnect: true };
        }
        if (dto.paymentId !== undefined) {
            data.payment = dto.paymentId
                ? { connect: { id: dto.paymentId } }
                : { disconnect: true };
        }
        if (dto.assignedToId !== undefined) {
            await this.validateAssignee(dto.assignedToId, user);
            data.assignedTo = {
                connect: {
                    id: dto.assignedToId,
                },
            };
        }
        const updated = await this.prisma.task.update({
            where: { id },
            data,
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: id,
            action: 'task.updated',
            before: current,
            after: updated,
        });
        await this.notifyTaskAssigned(updated, user);
        return updated;
    }
    async changeStatus(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                ...this.buildStatusUpdate(dto.status, user, dto.note),
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: id,
            action: 'task.status_changed',
            before: {
                status: current.status,
            },
            after: {
                status: updated.status,
            },
            metadata: {
                note: dto.note,
            },
        });
        return updated;
    }
    async assign(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        await this.validateAssignee(dto.assignedToId, user);
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                assignedToId: dto.assignedToId,
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: id,
            action: 'task.assigned',
            before: {
                assignedToId: current.assignedToId,
            },
            after: {
                assignedToId: updated.assignedToId,
            },
        });
        return updated;
    }
    async complete(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                status: client_1.TaskStatus.DONE,
                completedAt: new Date(),
                completedBy: {
                    connect: {
                        id: user.userId,
                    },
                },
                completionNote: dto.completionNote?.trim() || null,
                cancelledAt: null,
                cancelReason: null,
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: id,
            action: 'task.completed',
            before: current,
            after: updated,
        });
        return updated;
    }
    async reschedule(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                dueAt: new Date(dto.dueAt),
                reminderAt: dto.reminderAt !== undefined ? new Date(dto.reminderAt) : undefined,
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: id,
            action: 'task.rescheduled',
            before: {
                dueAt: current.dueAt,
                reminderAt: current.reminderAt,
            },
            after: {
                dueAt: updated.dueAt,
                reminderAt: updated.reminderAt,
            },
        });
        await this.notifyTaskRescheduled(updated, user);
        return updated;
    }
    async remove(id, user) {
        const current = await this.getTaskForMutation(id, user);
        const deleted = await this.prisma.task.delete({
            where: { id },
        });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'task',
            entityId: id,
            action: 'task.deleted',
            before: current,
        });
        return deleted;
    }
    buildWhere(query, user) {
        const and = [
            {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            this.taskScopeWhere(user),
        ];
        if (query.status)
            and.push({ status: query.status });
        if (query.priority)
            and.push({ priority: query.priority });
        if (query.assignedToId)
            and.push({ assignedToId: query.assignedToId });
        if (query.createdById)
            and.push({ createdById: query.createdById });
        if (query.companyId)
            and.push({ companyId: query.companyId });
        if (query.personId)
            and.push({ personId: query.personId });
        if (query.opportunityId)
            and.push({ opportunityId: query.opportunityId });
        if (query.commercialDocumentId) {
            and.push({ commercialDocumentId: query.commercialDocumentId });
        }
        if (query.paymentId)
            and.push({ paymentId: query.paymentId });
        if (query.dueFrom || query.dueTo) {
            and.push({
                dueAt: {
                    ...(query.dueFrom && { gte: new Date(query.dueFrom) }),
                    ...(query.dueTo && { lte: new Date(query.dueTo) }),
                },
            });
        }
        const search = query.search?.trim();
        if (search) {
            and.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { company: { legalName: { contains: search, mode: 'insensitive' } } },
                    { company: { brandName: { contains: search, mode: 'insensitive' } } },
                    { opportunity: { title: { contains: search, mode: 'insensitive' } } },
                    { person: { fullName: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }
        return {
            AND: and,
        };
    }
    async getTaskInScope(id, user) {
        const task = await this.prisma.task.findFirst({
            where: {
                AND: [
                    { id },
                    { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                    this.taskScopeWhere(user),
                ],
            },
            include: taskInclude,
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async getTaskForMutation(id, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Tasks are read-only for this role');
        }
        return this.getTaskInScope(id, user);
    }
    taskScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
            if (!user.team) {
                return { id: { in: [] } };
            }
            return {
                OR: [
                    { assignedTo: { team: user.team } },
                    { createdBy: { team: user.team } },
                    { company: { owner: { team: user.team } } },
                    { opportunity: { company: { owner: { team: user.team } } } },
                    { person: { company: { owner: { team: user.team } } } },
                    {
                        commercialDocument: {
                            opportunity: {
                                company: {
                                    owner: {
                                        team: user.team,
                                    },
                                },
                            },
                        },
                    },
                    {
                        payment: {
                            opportunity: {
                                company: {
                                    owner: {
                                        team: user.team,
                                    },
                                },
                            },
                        },
                    },
                ],
            };
        }
        return {
            OR: [
                { assignedToId: user.userId },
                { createdById: user.userId },
                { company: { ownerId: user.userId } },
                {
                    opportunity: {
                        OR: [
                            { ownerId: user.userId },
                            { company: { ownerId: user.userId } },
                        ],
                    },
                },
                { person: { company: { ownerId: user.userId } } },
                {
                    commercialDocument: {
                        opportunity: {
                            OR: [
                                { ownerId: user.userId },
                                { company: { ownerId: user.userId } },
                            ],
                        },
                    },
                },
                {
                    payment: {
                        opportunity: {
                            OR: [
                                { ownerId: user.userId },
                                { company: { ownerId: user.userId } },
                            ],
                        },
                    },
                },
            ],
        };
    }
    async validateLinkedEntities(dto, user) {
        if (dto.companyId) {
            await this.assertCompanyAccess(dto.companyId, user);
        }
        if (dto.opportunityId) {
            await this.assertOpportunityAccess(dto.opportunityId, user);
        }
        if (dto.personId) {
            await this.assertPersonAccess(dto.personId, user);
        }
        if (dto.commercialDocumentId) {
            await this.assertCommercialDocumentAccess(dto.commercialDocumentId, user);
        }
        if (dto.paymentId) {
            await this.assertPaymentAccess(dto.paymentId, user);
        }
    }
    async assertCompanyAccess(companyId, user) {
        const company = await this.prisma.company.findFirst({
            where: {
                AND: [
                    {
                        id: companyId,
                        archivedAt: null,
                        organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                    },
                    this.companyScopeWhere(user),
                ],
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
    }
    async assertOpportunityAccess(opportunityId, user) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: {
                AND: [
                    { id: opportunityId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                    this.opportunityScopeWhere(user),
                ],
            },
        });
        if (!opportunity) {
            throw new common_1.NotFoundException('Opportunity not found');
        }
        if (opportunity.archivedAt) {
            throw new common_1.BadRequestException('Archived opportunities cannot be changed');
        }
    }
    async assertPersonAccess(personId, user) {
        const person = await this.prisma.person.findFirst({
            where: {
                id: personId,
                company: {
                    AND: [
                        { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                        this.companyScopeWhere(user),
                    ],
                },
            },
        });
        if (!person) {
            throw new common_1.NotFoundException('Person not found');
        }
    }
    async assertCommercialDocumentAccess(documentId, user) {
        const document = await this.prisma.opportunityCommercialDocument.findFirst({
            where: {
                id: documentId,
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
        if (document.opportunity.archivedAt) {
            throw new common_1.BadRequestException('Archived opportunities cannot be changed');
        }
    }
    async assertPaymentAccess(paymentId, user) {
        const payment = await this.prisma.opportunityPayment.findFirst({
            where: {
                id: paymentId,
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
        if (payment.opportunity.archivedAt) {
            throw new common_1.BadRequestException('Archived opportunities cannot be changed');
        }
    }
    companyScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
            return user.team
                ? {
                    owner: {
                        team: user.team,
                    },
                }
                : {
                    id: {
                        in: [],
                    },
                };
        }
        return {
            ownerId: user.userId,
        };
    }
    opportunityScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
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
    async validateAssignee(assignedToId, user) {
        const assignee = await this.prisma.user.findUnique({
            where: {
                id: assignedToId,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
        });
        if (!assignee || !assignee.isActive || assignee.role === client_1.UserRole.BOARDS) {
            throw new common_1.BadRequestException('Task assignee must be an active internal user');
        }
        if (user.role === client_1.UserRole.REP && assignee.id !== user.userId) {
            throw new common_1.ForbiddenException('REP can only assign tasks to self');
        }
        if (user.role === client_1.UserRole.MANAGER &&
            (!user.team || assignee.team !== user.team)) {
            throw new common_1.ForbiddenException('Assignee must belong to the manager team');
        }
    }
    buildStatusUpdate(status, user, note) {
        if (status === client_1.TaskStatus.DONE) {
            return {
                status,
                completedAt: new Date(),
                completedBy: {
                    connect: {
                        id: user.userId,
                    },
                },
                completionNote: note?.trim() || undefined,
                cancelledAt: null,
                cancelReason: null,
            };
        }
        if (status === client_1.TaskStatus.CANCELLED) {
            return {
                status,
                cancelledAt: new Date(),
                cancelReason: note?.trim() || undefined,
                completedAt: null,
                completedBy: {
                    disconnect: true,
                },
                completionNote: null,
            };
        }
        return {
            status,
            completedAt: null,
            completedBy: {
                disconnect: true,
            },
            completionNote: null,
            cancelledAt: null,
            cancelReason: null,
        };
    }
    requiredText(value, message) {
        const normalized = value.trim();
        if (!normalized) {
            throw new common_1.BadRequestException(message);
        }
        return normalized;
    }
    async notifyTaskAssigned(task, user) {
        if (!task.assignedToId) {
            return;
        }
        await this.notifications.notifyUser({
            recipientId: task.assignedToId,
            actorId: user.userId,
            type: client_1.NotificationType.TASK_ASSIGNED,
            priority: client_1.NotificationPriority.NORMAL,
            title: 'کار جدید به شما ارجاع شد',
            body: task.title,
            entityType: client_1.NotificationEntityType.TASK,
            entityId: task.id,
            actionUrl: `/tasks/${task.id}`,
            skipSelf: true,
        });
    }
    async notifyTaskCompleted(task, user) {
        if (!task.createdById) {
            return;
        }
        await this.notifications.notifyUser({
            recipientId: task.createdById,
            actorId: user.userId,
            type: client_1.NotificationType.TASK_COMPLETED,
            priority: client_1.NotificationPriority.NORMAL,
            title: 'یک کار تکمیل شد',
            body: task.title,
            entityType: client_1.NotificationEntityType.TASK,
            entityId: task.id,
            actionUrl: `/tasks/${task.id}`,
            skipSelf: true,
        });
    }
    async notifyTaskRescheduled(task, user) {
        if (!task.assignedToId) {
            return;
        }
        await this.notifications.notifyUser({
            recipientId: task.assignedToId,
            actorId: user.userId,
            type: client_1.NotificationType.TASK_RESCHEDULED,
            priority: client_1.NotificationPriority.NORMAL,
            title: 'زمان‌بندی کار تغییر کرد',
            body: task.title,
            entityType: client_1.NotificationEntityType.TASK,
            entityId: task.id,
            actionUrl: `/tasks/${task.id}`,
            metadata: {
                dueAt: task.dueAt?.toISOString() ?? null,
            },
            skipSelf: true,
        });
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        notifications_service_1.NotificationsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map