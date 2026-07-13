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
const api_date_util_1 = require("../common/dates/api-date.util");
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
            archivedAt: true,
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
        const relations = await this.resolveCreateRelations(dto, user);
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
                dueAt: dto.dueAt ? (0, api_date_util_1.parseApiDate)(dto.dueAt, 'dueAt') : undefined,
                reminderAt: dto.reminderAt ? (0, api_date_util_1.parseApiDate)(dto.reminderAt, 'reminderAt') : undefined,
                companyId: relations.companyId ?? undefined,
                personId: relations.personId ?? undefined,
                opportunityId: relations.opportunityId ?? undefined,
                commercialDocumentId: relations.commercialDocumentId ?? undefined,
                paymentId: relations.paymentId ?? undefined,
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
        const relations = await this.resolveUpdateRelations(current, dto, user);
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
            data.dueAt = dto.dueAt ? (0, api_date_util_1.parseApiDate)(dto.dueAt, 'dueAt') : null;
        }
        if (dto.reminderAt !== undefined) {
            data.reminderAt = dto.reminderAt ? (0, api_date_util_1.parseApiDate)(dto.reminderAt, 'reminderAt') : null;
        }
        if (relations.companyId !== current.companyId) {
            data.company = relations.companyId
                ? { connect: { id: relations.companyId } }
                : { disconnect: true };
        }
        if (relations.personId !== current.personId) {
            data.person = relations.personId
                ? { connect: { id: relations.personId } }
                : { disconnect: true };
        }
        if (relations.opportunityId !== current.opportunityId) {
            data.opportunity = relations.opportunityId
                ? { connect: { id: relations.opportunityId } }
                : { disconnect: true };
        }
        if (relations.commercialDocumentId !== current.commercialDocumentId) {
            data.commercialDocument = relations.commercialDocumentId
                ? { connect: { id: relations.commercialDocumentId } }
                : { disconnect: true };
        }
        if (relations.paymentId !== current.paymentId) {
            data.payment = relations.paymentId
                ? { connect: { id: relations.paymentId } }
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
                dueAt: (0, api_date_util_1.parseApiDate)(dto.dueAt, 'dueAt'),
                reminderAt: dto.reminderAt !== undefined ? (0, api_date_util_1.parseApiDate)(dto.reminderAt, 'reminderAt') : undefined,
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
        const dueRange = (0, api_date_util_1.parseApiDateRange)(query.dueFrom, query.dueTo, 'dueFrom', 'dueTo');
        if (dueRange) {
            and.push({ dueAt: dueRange });
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
    async resolveCreateRelations(dto, user) {
        return this.resolveRelations({
            companyId: null,
            personId: null,
            opportunityId: null,
            commercialDocumentId: null,
            paymentId: null,
        }, dto, user);
    }
    async resolveUpdateRelations(current, dto, user) {
        const currentRelations = {
            companyId: current.companyId,
            personId: current.personId,
            opportunityId: current.opportunityId,
            commercialDocumentId: current.commercialDocumentId,
            paymentId: current.paymentId,
        };
        if (!this.hasRelationChanges(dto)) {
            return currentRelations;
        }
        return this.resolveRelations(currentRelations, dto, user, current);
    }
    async resolveRelations(current, dto, user, currentTask) {
        const explicitCompanyId = this.normalizeOptionalRelationId(dto.companyId);
        const explicitPersonId = this.normalizeOptionalRelationId(dto.personId);
        const explicitOpportunityId = this.normalizeOptionalRelationId(dto.opportunityId);
        const explicitDocumentId = this.normalizeOptionalRelationId(dto.commercialDocumentId);
        const explicitPaymentId = this.normalizeOptionalRelationId(dto.paymentId);
        const nextOpportunityId = dto.opportunityId !== undefined ? explicitOpportunityId : current.opportunityId;
        const nextPersonId = dto.personId !== undefined ? explicitPersonId : current.personId;
        const nextDocumentId = dto.commercialDocumentId !== undefined
            ? explicitDocumentId
            : current.commercialDocumentId;
        const nextPaymentId = dto.paymentId !== undefined ? explicitPaymentId : current.paymentId;
        let nextCompanyId = dto.companyId !== undefined ? explicitCompanyId : current.companyId;
        const opportunity = await this.resolveOpportunityContext(nextOpportunityId, user, currentTask);
        const person = await this.resolvePersonContext(nextPersonId, user, currentTask);
        const document = await this.resolveCommercialDocumentContext(nextDocumentId, user);
        const payment = await this.resolvePaymentContext(nextPaymentId, user);
        if (opportunity) {
            if (explicitCompanyId && explicitCompanyId !== opportunity.companyId) {
                throw new common_1.BadRequestException('Task company must match the selected opportunity company.');
            }
            nextCompanyId = opportunity.companyId;
        }
        else if (explicitCompanyId) {
            const company = await this.assertCompanyAccess(explicitCompanyId, user);
            nextCompanyId = company.id;
        }
        this.assertRelationConsistency({
            companyId: nextCompanyId,
            opportunity,
            person,
            document,
            payment,
        });
        return {
            companyId: nextCompanyId,
            personId: nextPersonId,
            opportunityId: nextOpportunityId,
            commercialDocumentId: nextDocumentId,
            paymentId: nextPaymentId,
        };
    }
    normalizeOptionalRelationId(value) {
        if (value === undefined || value === null)
            return null;
        return value;
    }
    hasRelationChanges(dto) {
        return (dto.companyId !== undefined ||
            dto.personId !== undefined ||
            dto.opportunityId !== undefined ||
            dto.commercialDocumentId !== undefined ||
            dto.paymentId !== undefined);
    }
    async resolveOpportunityContext(opportunityId, user, currentTask) {
        if (!opportunityId)
            return null;
        if (currentTask?.opportunity?.id === opportunityId) {
            return currentTask.opportunity;
        }
        return this.assertOpportunityAccess(opportunityId, user);
    }
    async resolvePersonContext(personId, user, currentTask) {
        if (!personId)
            return null;
        if (currentTask?.person?.id === personId) {
            return currentTask.person;
        }
        return this.assertPersonAccess(personId, user);
    }
    async resolveCommercialDocumentContext(documentId, user) {
        if (!documentId)
            return null;
        return this.assertCommercialDocumentAccess(documentId, user);
    }
    async resolvePaymentContext(paymentId, user) {
        if (!paymentId)
            return null;
        return this.assertPaymentAccess(paymentId, user);
    }
    assertRelationConsistency(context) {
        const { companyId, opportunity, person, document, payment } = context;
        if (person && companyId && person.companyId !== companyId) {
            throw new common_1.BadRequestException('Selected person does not belong to the task company.');
        }
        if (document) {
            if (opportunity && document.opportunityId !== opportunity.id) {
                throw new common_1.BadRequestException('Selected commercial document does not belong to the selected opportunity.');
            }
            if (companyId && document.opportunity.companyId !== companyId) {
                throw new common_1.BadRequestException('Selected opportunity is not available or does not belong to the selected company.');
            }
        }
        if (payment) {
            if (opportunity && payment.opportunityId !== opportunity.id) {
                throw new common_1.BadRequestException('Selected payment does not belong to the selected opportunity.');
            }
            if (companyId && payment.opportunity.companyId !== companyId) {
                throw new common_1.BadRequestException('Selected opportunity is not available or does not belong to the selected company.');
            }
            if (document &&
                payment.commercialDocumentId &&
                payment.commercialDocumentId !== document.id) {
                throw new common_1.BadRequestException('Selected payment does not belong to the selected commercial document.');
            }
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
        return company;
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
        return opportunity;
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
        return person;
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
        return document;
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
        return payment;
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