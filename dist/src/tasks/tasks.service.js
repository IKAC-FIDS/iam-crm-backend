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
const team_scope_util_1 = require("../common/tenant/team-scope.util");
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
    reviewer: { select: { id: true, fullName: true, email: true } },
    reviewRounds: {
        take: 1,
        orderBy: { roundNumber: 'desc' },
        select: {
            id: true, roundNumber: true, decision: true, submittedAt: true,
            reviewedAt: true, reviewComment: true, submissionNote: true,
            reviewer: { select: { id: true, fullName: true, email: true } },
            submittedBy: { select: { id: true, fullName: true, email: true } },
        },
    },
    team: { select: { id: true, code: true, name: true, isActive: true } },
    meeting: { select: { id: true, title: true, startAt: true, status: true } },
    activity: { select: { id: true, type: true, occurredAt: true, companyId: true } },
    product: { select: { id: true, code: true, name: true, isActive: true } },
    parentTask: { select: { id: true, title: true, status: true } },
    subtasks: {
        select: {
            id: true, title: true, status: true, priority: true, dueAt: true,
            assignedTo: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'asc' }],
    },
    _count: { select: { subtasks: true, reviewRounds: true } },
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
    async findTeamOptions(query, user) {
        const page = query.page ?? 1, limit = query.limit ?? 25, search = query.search?.trim();
        const where = {
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), isActive: true,
            ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }),
        };
        const [rows, total] = await Promise.all([
            this.prisma.team.findMany({ where, select: { id: true, name: true, code: true, _count: { select: { members: true } } }, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
            this.prisma.team.count({ where }),
        ]);
        return this.optionPage(rows.map((row) => ({ id: row.id, label: row.name, secondary: `${row.code} · ${row._count.members} عضو` })), total, page, limit);
    }
    async findEntityOptions(query, user) {
        const page = query.page ?? 1, limit = query.limit ?? 25, search = query.search?.trim(), organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const paging = { skip: (page - 1) * limit, take: limit };
        let data;
        let total;
        if (query.type === 'COMPANY') {
            const where = { AND: [{ organizationId, archivedAt: null }, this.companyScopeWhere(user), ...(search ? [{ OR: [{ legalName: { contains: search, mode: 'insensitive' } }, { brandName: { contains: search, mode: 'insensitive' } }] }] : [])] };
            const [rows, count] = await Promise.all([this.prisma.company.findMany({ where, select: { id: true, legalName: true, brandName: true }, orderBy: { legalName: 'asc' }, ...paging }), this.prisma.company.count({ where })]);
            data = rows.map((row) => ({ id: row.id, label: row.brandName || row.legalName, secondary: row.brandName ? row.legalName : undefined }));
            total = count;
        }
        else if (query.type === 'OPPORTUNITY') {
            const where = { AND: [{ organizationId, archivedAt: null }, this.opportunityScopeWhere(user), ...(search ? [{ title: { contains: search, mode: 'insensitive' } }] : [])] };
            const [rows, count] = await Promise.all([this.prisma.opportunity.findMany({ where, select: { id: true, title: true, company: { select: { legalName: true, brandName: true } } }, orderBy: { title: 'asc' }, ...paging }), this.prisma.opportunity.count({ where })]);
            data = rows.map((row) => ({ id: row.id, label: row.title, secondary: row.company.brandName || row.company.legalName }));
            total = count;
        }
        else if (query.type === 'PERSON') {
            const where = { company: { AND: [{ organizationId }, this.companyScopeWhere(user)] }, ...(search && { fullName: { contains: search, mode: 'insensitive' } }) };
            const [rows, count] = await Promise.all([this.prisma.person.findMany({ where, select: { id: true, fullName: true, title: true }, orderBy: { fullName: 'asc' }, ...paging }), this.prisma.person.count({ where })]);
            data = rows.map((row) => ({ id: row.id, label: row.fullName, secondary: row.title || undefined }));
            total = count;
        }
        else if (query.type === 'MEETING') {
            const where = { organizationId, ...(search && { title: { contains: search, mode: 'insensitive' } }) };
            const [rows, count] = await Promise.all([this.prisma.meeting.findMany({ where, select: { id: true, title: true, startAt: true }, orderBy: { startAt: 'desc' }, ...paging }), this.prisma.meeting.count({ where })]);
            data = rows.map((row) => ({ id: row.id, label: row.title, secondary: row.startAt.toISOString() }));
            total = count;
        }
        else if (query.type === 'ACTIVITY') {
            const where = { company: { AND: [{ organizationId }, this.companyScopeWhere(user)] }, ...(search && { OR: [{ notes: { contains: search, mode: 'insensitive' } }, { outcome: { contains: search, mode: 'insensitive' } }] }) };
            const [rows, count] = await Promise.all([this.prisma.activity.findMany({ where, select: { id: true, type: true, notes: true, occurredAt: true }, orderBy: { occurredAt: 'desc' }, ...paging }), this.prisma.activity.count({ where })]);
            data = rows.map((row) => ({ id: row.id, label: row.notes?.trim() || row.type, secondary: row.occurredAt.toISOString() }));
            total = count;
        }
        else {
            const where = { isActive: true, ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] }) };
            const [rows, count] = await Promise.all([this.prisma.productCatalogItem.findMany({ where, select: { id: true, name: true, code: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], ...paging }), this.prisma.productCatalogItem.count({ where })]);
            data = rows.map((row) => ({ id: row.id, label: row.name, secondary: row.code }));
            total = count;
        }
        return this.optionPage(data, total, page, limit);
    }
    async create(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Tasks are read-only for this role');
        }
        const relations = await this.resolveCreateRelations(dto, user);
        const assignmentInput = {
            assignmentScope: dto.assignmentScope,
            teamId: dto.teamId,
            assigneeId: dto.assignedToId,
        };
        this.assertAssignmentPermission(assignmentInput, user, 'create');
        const assignment = await this.resolveAssignment(assignmentInput, user);
        if (dto.reviewerId && !this.hasPermission(user, 'task:assign-reviewer')) {
            throw new common_1.ForbiddenException({ code: 'TASK_REVIEWER_ASSIGN_PERMISSION_REQUIRED', message: 'Assigning a reviewer requires task:assign-reviewer' });
        }
        const requiresReview = dto.requiresReview ?? Boolean(dto.reviewerId);
        if (requiresReview && !dto.reviewerId) {
            throw new common_1.BadRequestException({ code: 'TASK_REVIEWER_REQUIRED', message: 'A review-required task must have a reviewer' });
        }
        if (dto.reviewerId)
            await this.validateReviewer(dto.reviewerId, assignment.assignedToId, user);
        const status = dto.status ?? client_1.TaskStatus.TODO;
        if (status === client_1.TaskStatus.DONE && requiresReview)
            this.assertReviewApproved(client_1.TaskReviewStatus.DRAFT, true);
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
                meetingId: relations.meetingId ?? undefined,
                activityId: relations.activityId ?? undefined,
                productId: relations.productId ?? undefined,
                assignmentScope: assignment.assignmentScope,
                teamId: assignment.teamId ?? undefined,
                assignedToId: assignment.assignedToId ?? undefined,
                requiresReview,
                reviewStatus: requiresReview ? client_1.TaskReviewStatus.DRAFT : client_1.TaskReviewStatus.NOT_REQUIRED,
                reviewerId: dto.reviewerId ?? undefined,
                createdById: user.userId,
                completedAt: status === client_1.TaskStatus.DONE ? now : undefined,
                completedById: status === client_1.TaskStatus.DONE ? user.userId : undefined,
                cancelledAt: status === client_1.TaskStatus.CANCELLED ? now : undefined,
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: task.organizationId,
            entityType: 'task',
            entityId: task.id,
            action: 'task.created',
            after: task,
        });
        if (task.requiresReview) {
            await this.audit.record({ actorId: user.userId, organizationId: task.organizationId, entityType: 'task', entityId: task.id, action: 'task.review_required', after: { requiresReview: true, reviewerId: task.reviewerId } });
        }
        await this.notifyTaskAssigned(task, user);
        if (task.reviewerId)
            await this.notifyReviewUser(task.reviewerId, user, task, 'شما به‌عنوان بازبین کار تعیین شدید', 'REVIEWER_ASSIGNED');
        return task;
    }
    async update(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        const reviewConfigurationChanged = dto.requiresReview !== undefined || dto.reviewerId !== undefined;
        if (reviewConfigurationChanged && !this.hasPermission(user, 'task:assign-reviewer')) {
            throw new common_1.ForbiddenException({ code: 'TASK_REVIEWER_ASSIGN_PERMISSION_REQUIRED', message: 'Changing review configuration requires task:assign-reviewer' });
        }
        if (reviewConfigurationChanged && current.reviewStatus === client_1.TaskReviewStatus.PENDING_REVIEW) {
            throw new common_1.BadRequestException({ code: 'TASK_REVIEW_PENDING', message: 'Reviewer configuration cannot change while a review is pending' });
        }
        const nextRequiresReview = dto.requiresReview ?? current.requiresReview;
        const nextReviewerId = dto.requiresReview === false ? null : (dto.reviewerId ?? current.reviewerId);
        if (nextRequiresReview && !nextReviewerId) {
            throw new common_1.BadRequestException({ code: 'TASK_REVIEWER_REQUIRED', message: 'A review-required task must have a reviewer' });
        }
        if (nextReviewerId && (dto.assignedToId ?? current.assignedToId) === nextReviewerId) {
            throw new common_1.BadRequestException({ code: 'TASK_SELF_REVIEW_NOT_ALLOWED', message: 'Task assignee cannot review their own work' });
        }
        if (nextReviewerId && nextReviewerId !== current.reviewerId) {
            await this.validateReviewer(nextReviewerId, dto.assignedToId ?? current.assignedToId, user);
        }
        const relations = await this.resolveUpdateRelations(current, dto, user);
        const data = {};
        if (reviewConfigurationChanged) {
            data.requiresReview = nextRequiresReview;
            data.reviewStatus = nextRequiresReview ? client_1.TaskReviewStatus.DRAFT : client_1.TaskReviewStatus.NOT_REQUIRED;
            data.reviewer = nextReviewerId ? { connect: { id: nextReviewerId } } : { disconnect: true };
        }
        if (dto.title !== undefined) {
            data.title = this.requiredText(dto.title, 'عنوان کار الزامی است');
        }
        if (dto.description !== undefined) {
            data.description = dto.description?.trim() || null;
        }
        if (dto.status !== undefined) {
            this.assertStatusTransition(current.status, dto.status);
            if (dto.status === client_1.TaskStatus.CANCELLED) {
                throw new common_1.BadRequestException({ code: 'TASK_CANCEL_REASON_REQUIRED', message: 'Use the status endpoint and provide a cancellation reason' });
            }
            if (dto.status === client_1.TaskStatus.DONE) {
                await this.assertSubtasksResolved(id, current.organizationId);
                this.assertReviewApproved(current.reviewStatus, current.requiresReview);
            }
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
        const reviewSensitiveChange = dto.title !== undefined || dto.description !== undefined || this.hasRelationChanges(dto) || dto.assignedToId !== undefined;
        if (!reviewConfigurationChanged && current.requiresReview && current.reviewStatus === client_1.TaskReviewStatus.APPROVED && reviewSensitiveChange) {
            data.reviewStatus = client_1.TaskReviewStatus.DRAFT;
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
        if (dto.assignedToId !== undefined || dto.assignmentScope !== undefined || dto.teamId !== undefined) {
            const assignmentInput = {
                assignmentScope: dto.assignmentScope ?? current.assignmentScope,
                teamId: dto.teamId ?? current.teamId ?? undefined,
                assigneeId: dto.assignedToId ?? current.assignedToId ?? undefined,
            };
            this.assertAssignmentPermission(assignmentInput, user, 'update');
            const assignment = await this.resolveAssignment(assignmentInput, user);
            data.assignmentScope = assignment.assignmentScope;
            data.team = assignment.teamId ? { connect: { id: assignment.teamId } } : { disconnect: true };
            data.assignedTo = assignment.assignedToId ? { connect: { id: assignment.assignedToId } } : { disconnect: true };
        }
        if (relations.meetingId !== current.meetingId) {
            data.meeting = relations.meetingId ? { connect: { id: relations.meetingId } } : { disconnect: true };
        }
        if (relations.activityId !== current.activityId) {
            data.activity = relations.activityId ? { connect: { id: relations.activityId } } : { disconnect: true };
        }
        if (relations.productId !== current.productId) {
            data.product = relations.productId ? { connect: { id: relations.productId } } : { disconnect: true };
        }
        const updated = await this.prisma.task.update({
            where: { id },
            data,
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: current.organizationId,
            entityType: 'task',
            entityId: id,
            action: 'task.updated',
            before: current,
            after: updated,
        });
        if (reviewConfigurationChanged) {
            await this.audit.record({ actorId: user.userId, organizationId: current.organizationId, entityType: 'task', entityId: id, action: current.reviewerId && current.reviewerId !== updated.reviewerId ? 'task.reviewer_changed' : 'task.reviewer_assigned', before: { requiresReview: current.requiresReview, reviewerId: current.reviewerId }, after: { requiresReview: updated.requiresReview, reviewerId: updated.reviewerId } });
        }
        if (this.hasRelationChanges(dto)) {
            await this.audit.record({
                actorId: user.userId, organizationId: current.organizationId,
                entityType: 'task', entityId: id, action: 'task.linked_entity_changed',
                before: this.relationSnapshot(current), after: this.relationSnapshot(updated),
            });
        }
        if (updated.assignedToId && updated.assignedToId !== current.assignedToId)
            await this.notifyTaskAssigned(updated, user);
        if (updated.reviewerId && updated.reviewerId !== current.reviewerId)
            await this.notifyReviewUser(updated.reviewerId, user, updated, 'شما به‌عنوان بازبین کار تعیین شدید', 'REVIEWER_ASSIGNED');
        return updated;
    }
    async changeStatus(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        this.assertStatusTransition(current.status, dto.status);
        if (dto.status === client_1.TaskStatus.DONE) {
            await this.assertSubtasksResolved(id, current.organizationId);
            this.assertReviewApproved(current.reviewStatus, current.requiresReview);
        }
        if (dto.status === client_1.TaskStatus.CANCELLED && !dto.note?.trim()) {
            throw new common_1.BadRequestException({ code: 'TASK_CANCEL_REASON_REQUIRED', message: 'A cancellation reason is required' });
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const changedTask = await tx.task.update({
                where: { id },
                data: {
                    ...this.buildStatusUpdate(dto.status, user, dto.note),
                    ...(dto.status === client_1.TaskStatus.CANCELLED && current.reviewStatus === client_1.TaskReviewStatus.PENDING_REVIEW
                        ? { reviewStatus: current.requiresReview ? client_1.TaskReviewStatus.DRAFT : client_1.TaskReviewStatus.NOT_REQUIRED }
                        : {}),
                },
                include: taskInclude,
            });
            if (dto.status === client_1.TaskStatus.CANCELLED && current.reviewStatus === client_1.TaskReviewStatus.PENDING_REVIEW) {
                await tx.taskReviewRound.updateMany({ where: { taskId: id, decision: client_1.TaskReviewDecision.PENDING }, data: { decision: client_1.TaskReviewDecision.CANCELLED, reviewedAt: new Date(), reviewComment: dto.note?.trim() } });
            }
            return changedTask;
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: current.organizationId,
            entityType: 'task',
            entityId: id,
            action: dto.status === client_1.TaskStatus.CANCELLED
                ? 'task.cancelled'
                : dto.status === client_1.TaskStatus.DONE
                    ? 'task.completed'
                    : 'task.status_changed',
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
        if (updated.status === client_1.TaskStatus.DONE)
            await this.notifyTaskCompleted(updated, user);
        if (updated.parentTaskId && (updated.status === client_1.TaskStatus.DONE || updated.status === client_1.TaskStatus.CANCELLED)) {
            await this.notifyParentReady(updated.parentTaskId, updated.organizationId, user);
        }
        return updated;
    }
    async assign(id, dto, user) {
        return this.reassignWithOperation(id, {
            assignmentScope: dto.assignedToId === user.userId ? client_1.TaskAssignmentScope.SELF : client_1.TaskAssignmentScope.ORGANIZATION,
            assigneeId: dto.assignedToId,
        }, user, 'assign');
    }
    async reassign(id, dto, user) {
        return this.reassignWithOperation(id, dto, user, 'reassign');
    }
    async reassignWithOperation(id, dto, user, operation) {
        const current = await this.getTaskForMutation(id, user);
        this.assertTaskOpen(current.status, 'Completed or cancelled tasks cannot be reassigned');
        this.assertAssignmentPermission(dto, user, operation);
        const assignment = await this.resolveAssignment(dto, user);
        if (current.reviewerId && assignment.assignedToId === current.reviewerId) {
            throw new common_1.BadRequestException({ code: 'TASK_SELF_REVIEW_NOT_ALLOWED', message: 'Task assignee cannot review their own work' });
        }
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                assignmentScope: assignment.assignmentScope,
                teamId: assignment.teamId,
                assignedToId: assignment.assignedToId,
                ...(current.requiresReview && current.reviewStatus === client_1.TaskReviewStatus.APPROVED ? { reviewStatus: client_1.TaskReviewStatus.DRAFT } : {}),
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: current.organizationId,
            entityType: 'task', entityId: id, action: 'task.reassigned',
            before: { assignedToId: current.assignedToId, teamId: current.teamId, assignmentScope: current.assignmentScope },
            after: { assignedToId: updated.assignedToId, teamId: updated.teamId, assignmentScope: updated.assignmentScope },
            metadata: { reason: dto.reason?.trim() || undefined },
        });
        if (updated.assignedToId && updated.assignedToId !== current.assignedToId)
            await this.notifyTaskAssigned(updated, user);
        return updated;
    }
    async findSubtasks(id, user) {
        const parent = await this.getTaskInScope(id, user);
        return this.prisma.task.findMany({
            where: { organizationId: parent.organizationId, parentTaskId: id, ...this.taskScopeWhere(user) },
            include: taskInclude,
            orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async createSubtask(id, dto, user) {
        const parent = await this.getTaskForMutation(id, user);
        this.assertTaskOpen(parent.status, 'Closed tasks cannot receive subtasks');
        const depth = await this.taskDepth(parent);
        if (depth >= 3)
            throw new common_1.BadRequestException({ code: 'TASK_MAX_DEPTH_EXCEEDED', message: 'Task hierarchy is limited to 3 levels' });
        const assignmentInput = {
            assignmentScope: dto.assignmentScope,
            teamId: dto.teamId,
            assigneeId: dto.assigneeId,
        };
        this.assertAssignmentPermission(assignmentInput, user, 'subtask');
        const assignment = await this.resolveAssignment(assignmentInput, user);
        const inherited = dto.inheritLinkedEntity !== false;
        const child = await this.prisma.task.create({
            data: {
                organizationId: parent.organizationId,
                parentTaskId: parent.id,
                title: this.requiredText(dto.title, 'عنوان کار الزامی است'),
                description: dto.description?.trim() || undefined,
                priority: dto.priority ?? parent.priority,
                dueAt: dto.dueAt ? (0, api_date_util_1.parseApiDate)(dto.dueAt, 'dueAt') : undefined,
                assignmentScope: assignment.assignmentScope,
                teamId: assignment.teamId,
                assignedToId: assignment.assignedToId,
                createdById: user.userId,
                ...(inherited && {
                    companyId: parent.companyId, personId: parent.personId, opportunityId: parent.opportunityId,
                    commercialDocumentId: parent.commercialDocumentId, paymentId: parent.paymentId,
                    meetingId: parent.meetingId, activityId: parent.activityId, productId: parent.productId,
                }),
            },
            include: taskInclude,
        });
        await this.audit.record({
            actorId: user.userId, organizationId: parent.organizationId,
            entityType: 'task', entityId: parent.id, action: 'task.subtask_created',
            after: { subtaskId: child.id, assigneeId: child.assignedToId, assignmentScope: child.assignmentScope },
        });
        await this.notifyTaskAssigned(child, user, 'زیرکار جدید به شما ارجاع شد');
        return child;
    }
    async complete(id, dto, user) {
        const current = await this.getTaskForMutation(id, user);
        this.assertStatusTransition(current.status, client_1.TaskStatus.DONE);
        await this.assertSubtasksResolved(id, current.organizationId);
        this.assertReviewApproved(current.reviewStatus, current.requiresReview);
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
            organizationId: current.organizationId,
            entityType: 'task',
            entityId: id,
            action: 'task.completed',
            before: current,
            after: updated,
        });
        await this.notifyTaskCompleted(updated, user);
        if (updated.parentTaskId)
            await this.notifyParentReady(updated.parentTaskId, updated.organizationId, user);
        return updated;
    }
    async findReviews(id, user) {
        const task = await this.getTaskInScope(id, user);
        return this.prisma.taskReviewRound.findMany({
            where: { taskId: task.id, organizationId: task.organizationId },
            include: {
                reviewer: { select: { id: true, fullName: true, email: true } },
                submittedBy: { select: { id: true, fullName: true, email: true } },
                artifacts: { include: { artifact: { select: { id: true, name: true, type: true, provider: true, mimeType: true, sizeBytes: true, externalUrl: true } } } },
            },
            orderBy: { roundNumber: 'desc' },
        });
    }
    async submitReview(id, dto, user) {
        if (!this.hasPermission(user, 'task:submit-review'))
            throw new common_1.ForbiddenException('task:submit-review permission is required');
        const task = await this.getTaskForMutation(id, user);
        this.assertTaskOpen(task.status, 'Closed tasks cannot be submitted for review');
        if (!task.requiresReview)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEW_NOT_REQUIRED', message: 'This task does not require review' });
        if (task.reviewStatus === client_1.TaskReviewStatus.PENDING_REVIEW)
            throw new common_1.ConflictException({ code: 'TASK_REVIEW_ALREADY_PENDING', message: 'A review is already pending' });
        if (task.reviewStatus === client_1.TaskReviewStatus.APPROVED)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEW_ALREADY_APPROVED', message: 'Approved work must be materially updated before resubmission' });
        const reviewerId = dto.reviewerId ?? task.reviewerId;
        if (!reviewerId)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEWER_REQUIRED', message: 'A reviewer is required' });
        if (dto.reviewerId && dto.reviewerId !== task.reviewerId && !this.hasPermission(user, 'task:assign-reviewer')) {
            throw new common_1.ForbiddenException({ code: 'TASK_REVIEWER_ASSIGN_PERMISSION_REQUIRED', message: 'Changing reviewer requires task:assign-reviewer' });
        }
        await this.validateReviewer(reviewerId, task.assignedToId, user, user.userId);
        const artifactIds = [...new Set(dto.artifactIds ?? [])];
        await this.validateSubmissionArtifacts(task.id, artifactIds, task.organizationId);
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const latest = await tx.taskReviewRound.aggregate({ where: { taskId: id }, _max: { roundNumber: true } });
                const roundNumber = (latest._max.roundNumber ?? 0) + 1;
                const changed = await tx.task.updateMany({
                    where: { id, organizationId: task.organizationId, reviewStatus: { in: [client_1.TaskReviewStatus.DRAFT, client_1.TaskReviewStatus.CHANGES_REQUESTED] }, status: { notIn: [client_1.TaskStatus.DONE, client_1.TaskStatus.CANCELLED] } },
                    data: { reviewStatus: client_1.TaskReviewStatus.PENDING_REVIEW, reviewerId },
                });
                if (changed.count !== 1)
                    throw new common_1.ConflictException({ code: 'TASK_REVIEW_STATE_CHANGED', message: 'Task review state changed; refresh and retry' });
                const round = await tx.taskReviewRound.create({ data: {
                        organizationId: task.organizationId, taskId: id, roundNumber, reviewerId,
                        submittedById: user.userId, submissionNote: dto.note?.trim() || undefined,
                        artifacts: artifactIds.length ? { create: artifactIds.map((artifactId) => ({ artifactId, addedById: user.userId })) } : undefined,
                    } });
                return round;
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
            const action = result.roundNumber > 1 ? 'task.review_resubmitted' : 'task.review_submitted';
            await this.audit.record({ actorId: user.userId, organizationId: task.organizationId, entityType: 'task', entityId: id, action, metadata: { taskId: id, reviewRoundId: result.id, roundNumber: result.roundNumber, reviewerId, submitterId: user.userId, artifactIds } });
            await this.notifyReviewUser(reviewerId, user, task, result.roundNumber > 1 ? 'کار برای بازبینی مجدد ارسال شد' : 'کار جدیدی منتظر بازبینی شماست', result.roundNumber > 1 ? 'RESUBMITTED' : 'REQUESTED');
            return this.findOne(id, user);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code))
                throw new common_1.ConflictException({ code: 'TASK_REVIEW_CONFLICT', message: 'Concurrent review submission detected; refresh and retry' });
            throw error;
        }
    }
    async decideReview(id, decision, dto, user) {
        if (!this.hasPermission(user, 'task:review'))
            throw new common_1.ForbiddenException('task:review permission is required');
        const task = await this.getTaskForMutation(id, user);
        this.assertTaskOpen(task.status, 'Closed tasks cannot be reviewed');
        if (task.reviewStatus !== client_1.TaskReviewStatus.PENDING_REVIEW)
            throw new common_1.ConflictException({ code: 'TASK_REVIEW_NOT_PENDING', message: 'Task is not pending review' });
        if (task.reviewerId !== user.userId)
            throw new common_1.ForbiddenException({ code: 'TASK_REVIEWER_MISMATCH', message: 'Only the assigned reviewer can decide this review' });
        const comment = dto.comment?.trim();
        if (decision === 'CHANGES_REQUESTED' && !comment)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEW_COMMENT_REQUIRED', message: 'A review comment is required when requesting changes' });
        const pending = await this.prisma.taskReviewRound.findFirst({ where: { taskId: id, organizationId: task.organizationId, decision: client_1.TaskReviewDecision.PENDING }, orderBy: { roundNumber: 'desc' } });
        if (!pending)
            throw new common_1.ConflictException({ code: 'TASK_REVIEW_ROUND_NOT_PENDING', message: 'No pending review round was found' });
        const reviewDecision = decision === 'APPROVED' ? client_1.TaskReviewDecision.APPROVED : client_1.TaskReviewDecision.CHANGES_REQUESTED;
        const reviewStatus = decision === 'APPROVED' ? client_1.TaskReviewStatus.APPROVED : client_1.TaskReviewStatus.CHANGES_REQUESTED;
        try {
            await this.prisma.$transaction(async (tx) => {
                const changed = await tx.taskReviewRound.updateMany({ where: { id: pending.id, decision: client_1.TaskReviewDecision.PENDING }, data: { decision: reviewDecision, reviewedAt: new Date(), reviewComment: comment || undefined } });
                if (changed.count !== 1)
                    throw new common_1.ConflictException({ code: 'TASK_REVIEW_ALREADY_DECIDED', message: 'This review round was already decided' });
                const taskChanged = await tx.task.updateMany({ where: { id, organizationId: task.organizationId, reviewStatus: client_1.TaskReviewStatus.PENDING_REVIEW, reviewerId: user.userId }, data: { reviewStatus } });
                if (taskChanged.count !== 1)
                    throw new common_1.ConflictException({ code: 'TASK_REVIEW_STATE_CHANGED', message: 'Task review state changed; refresh and retry' });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
                throw new common_1.ConflictException({ code: 'TASK_REVIEW_CONFLICT', message: 'Concurrent review decision detected; refresh and retry' });
            }
            throw error;
        }
        await this.audit.record({ actorId: user.userId, organizationId: task.organizationId, entityType: 'task', entityId: id, action: decision === 'APPROVED' ? 'task.review_approved' : 'task.review_changes_requested', metadata: { taskId: id, reviewRoundId: pending.id, roundNumber: pending.roundNumber, reviewerId: user.userId, decision, comment } });
        const recipients = [...new Set([task.assignedToId, pending.submittedById].filter((value) => Boolean(value && value !== user.userId)))];
        await Promise.all(recipients.map((recipientId) => this.notifyReviewUser(recipientId, user, task, decision === 'APPROVED' ? 'بازبینی کار تأیید شد' : 'اصلاحات برای کار درخواست شد', decision)));
        return this.findOne(id, user);
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
            organizationId: current.organizationId,
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
            organizationId: current.organizationId,
            entityType: 'task',
            entityId: id,
            action: 'task.deleted',
            before: current,
        });
        return deleted;
    }
    buildWhere(query, user) {
        if (query.overdueOnly === 'true' &&
            query.status &&
            query.status !== client_1.TaskStatus.TODO &&
            query.status !== client_1.TaskStatus.IN_PROGRESS) {
            throw new common_1.BadRequestException('overdueOnly=true is only compatible with TODO or IN_PROGRESS status');
        }
        const and = [
            {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            this.taskScopeWhere(user),
        ];
        if (query.status)
            and.push({ status: query.status });
        if (query.overdueOnly === 'true') {
            and.push({
                dueAt: { not: null, lt: new Date() },
                ...(!query.status && { status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS] } }),
            });
        }
        if (query.priority)
            and.push({ priority: query.priority });
        if (query.assignedToId)
            and.push({ assignedToId: query.assignedToId });
        if (query.createdById)
            and.push({ createdById: query.createdById });
        if (query.assignmentScope)
            and.push({ assignmentScope: query.assignmentScope });
        if (query.teamId)
            and.push({ teamId: query.teamId });
        if (query.parentTaskId)
            and.push({ parentTaskId: query.parentTaskId });
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
        if (query.meetingId)
            and.push({ meetingId: query.meetingId });
        if (query.activityId)
            and.push({ activityId: query.activityId });
        if (query.productId)
            and.push({ productId: query.productId });
        if (query.reviewStatus)
            and.push({ reviewStatus: query.reviewStatus });
        if (query.reviewerId)
            and.push({ reviewerId: query.reviewerId });
        if (query.awaitingMyReview === 'true') {
            if (!this.hasPermission(user, 'task:review'))
                throw new common_1.ForbiddenException('task:review permission is required');
            and.push({ reviewStatus: client_1.TaskReviewStatus.PENDING_REVIEW, reviewerId: user.userId });
        }
        if (query.view === 'mine')
            and.push({ assignedToId: user.userId });
        if (query.view === 'created')
            and.push({ createdById: user.userId });
        if (query.view === 'team') {
            if (!this.hasPermission(user, 'task:view-team') || !user.teamId)
                throw new common_1.ForbiddenException('Team task visibility is not permitted');
            and.push({ assignmentScope: client_1.TaskAssignmentScope.TEAM, teamId: user.teamId });
        }
        if (query.view === 'organization') {
            if (!this.hasPermission(user, 'task:view-organization'))
                throw new common_1.ForbiddenException('Organization task visibility is not permitted');
            and.push({ assignmentScope: client_1.TaskAssignmentScope.ORGANIZATION });
        }
        if (query.linkedEntityType) {
            const field = {
                COMPANY: 'companyId', OPPORTUNITY: 'opportunityId', PERSON: 'personId',
                MEETING: 'meetingId', ACTIVITY: 'activityId', PRODUCT: 'productId',
            }[query.linkedEntityType];
            and.push({ [field]: { not: null } });
        }
        const dueRange = (0, api_date_util_1.parseApiDateRange)(query.dueFrom, query.dueTo, 'dueFrom', 'dueTo');
        if (dueRange) {
            and.push({ dueAt: dueRange });
        }
        if (query.dueState) {
            const now = new Date();
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            if (query.dueState === 'none')
                and.push({ dueAt: null });
            if (query.dueState === 'overdue')
                and.push({ dueAt: { lt: now }, status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS] } });
            if (query.dueState === 'today')
                and.push({ dueAt: { gte: start, lt: end } });
            if (query.dueState === 'upcoming')
                and.push({ dueAt: { gte: end }, status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS] } });
            if (query.dueState === 'completed')
                and.push({ status: { in: [client_1.TaskStatus.DONE, client_1.TaskStatus.CANCELLED] } });
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
        if (this.hasPermission(user, 'task:view-organization'))
            return {};
        if (user.role === client_1.UserRole.MANAGER) {
            if (!user.teamId && !user.team) {
                return { id: { in: [] } };
            }
            return {
                OR: [
                    ...(user.teamId && this.hasPermission(user, 'task:view-team')
                        ? [{ assignmentScope: client_1.TaskAssignmentScope.TEAM, teamId: user.teamId }]
                        : []),
                    { assignedTo: (0, team_scope_util_1.userTeamScopeWhere)(user) },
                    { createdBy: (0, team_scope_util_1.userTeamScopeWhere)(user) },
                    ...(this.hasPermission(user, 'task:review') ? [{ reviewerId: user.userId }] : []),
                    { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } },
                    { opportunity: { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } } },
                    { person: { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } } },
                    {
                        commercialDocument: {
                            opportunity: {
                                company: {
                                    owner: (0, team_scope_util_1.userTeamScopeWhere)(user),
                                },
                            },
                        },
                    },
                    {
                        payment: {
                            opportunity: {
                                company: {
                                    owner: (0, team_scope_util_1.userTeamScopeWhere)(user),
                                },
                            },
                        },
                    },
                ],
            };
        }
        return {
            OR: [
                ...(user.teamId && this.hasPermission(user, 'task:view-team')
                    ? [{ assignmentScope: client_1.TaskAssignmentScope.TEAM, teamId: user.teamId }]
                    : []),
                { assignedToId: user.userId },
                { createdById: user.userId },
                ...(this.hasPermission(user, 'task:review') ? [{ reviewerId: user.userId }] : []),
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
            meetingId: null,
            activityId: null,
            productId: null,
        }, dto, user);
    }
    async resolveUpdateRelations(current, dto, user) {
        const currentRelations = {
            companyId: current.companyId,
            personId: current.personId,
            opportunityId: current.opportunityId,
            commercialDocumentId: current.commercialDocumentId,
            paymentId: current.paymentId,
            meetingId: current.meetingId,
            activityId: current.activityId,
            productId: current.productId,
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
        const explicitMeetingId = this.normalizeOptionalRelationId(dto.meetingId);
        const explicitActivityId = this.normalizeOptionalRelationId(dto.activityId);
        const explicitProductId = this.normalizeOptionalRelationId(dto.productId);
        const nextOpportunityId = dto.opportunityId !== undefined ? explicitOpportunityId : current.opportunityId;
        const nextPersonId = dto.personId !== undefined ? explicitPersonId : current.personId;
        const nextDocumentId = dto.commercialDocumentId !== undefined
            ? explicitDocumentId
            : current.commercialDocumentId;
        const nextPaymentId = dto.paymentId !== undefined ? explicitPaymentId : current.paymentId;
        const nextMeetingId = dto.meetingId !== undefined ? explicitMeetingId : current.meetingId;
        const nextActivityId = dto.activityId !== undefined ? explicitActivityId : current.activityId;
        const nextProductId = dto.productId !== undefined ? explicitProductId : current.productId;
        let nextCompanyId = dto.companyId !== undefined ? explicitCompanyId : current.companyId;
        const opportunity = await this.resolveOpportunityContext(nextOpportunityId, user, currentTask);
        const person = await this.resolvePersonContext(nextPersonId, user, currentTask);
        const document = await this.resolveCommercialDocumentContext(nextDocumentId, user);
        const payment = await this.resolvePaymentContext(nextPaymentId, user);
        if (nextMeetingId)
            await this.assertMeetingAccess(nextMeetingId, user);
        if (nextActivityId)
            await this.assertActivityAccess(nextActivityId, user);
        if (nextProductId)
            await this.assertProductAccess(nextProductId);
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
            meetingId: nextMeetingId,
            activityId: nextActivityId,
            productId: nextProductId,
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
            dto.paymentId !== undefined
            || dto.meetingId !== undefined
            || dto.activityId !== undefined
            || dto.productId !== undefined);
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
    async assertMeetingAccess(meetingId, user) {
        const meeting = await this.prisma.meeting.findFirst({
            where: { id: meetingId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            select: { id: true },
        });
        if (!meeting)
            throw new common_1.NotFoundException('Meeting not found');
    }
    async assertActivityAccess(activityId, user) {
        const activity = await this.prisma.activity.findFirst({
            where: { id: activityId, company: { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) } },
            select: { id: true },
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
    }
    async assertProductAccess(productId) {
        const product = await this.prisma.productCatalogItem.findFirst({
            where: { id: productId, isActive: true }, select: { id: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
    }
    async resolveAssignment(input, user) {
        const scope = input.assignmentScope
            ?? (input.assigneeId && input.assigneeId !== user.userId ? client_1.TaskAssignmentScope.ORGANIZATION : client_1.TaskAssignmentScope.SELF);
        if (scope === client_1.TaskAssignmentScope.SELF) {
            if (input.teamId)
                throw new common_1.BadRequestException({ code: 'TASK_SELF_TEAM_NOT_ALLOWED', message: 'SELF tasks cannot have a team target' });
            if (input.assigneeId && input.assigneeId !== user.userId)
                throw new common_1.BadRequestException({ code: 'TASK_SELF_ASSIGNEE_INVALID', message: 'SELF tasks must be assigned to the acting user' });
            return { assignmentScope: scope, teamId: null, assignedToId: user.userId };
        }
        let team = null;
        if (scope === client_1.TaskAssignmentScope.TEAM) {
            if (!input.teamId)
                throw new common_1.BadRequestException({ code: 'TASK_TEAM_REQUIRED', message: 'TEAM assignment requires an active team' });
            team = await this.prisma.team.findFirst({
                where: { id: input.teamId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), isActive: true }, select: { id: true },
            });
            if (!team)
                throw new common_1.BadRequestException({ code: 'TASK_TEAM_INVALID', message: 'Task team must be active and belong to the organization' });
        }
        else if (input.teamId) {
            throw new common_1.BadRequestException({ code: 'TASK_ORGANIZATION_TEAM_NOT_ALLOWED', message: 'ORGANIZATION assignment does not use a team target' });
        }
        const assigneeId = input.assigneeId || null;
        if (assigneeId) {
            const assignee = await this.validateAssignee(assigneeId, user, scope === client_1.TaskAssignmentScope.TEAM ? team.id : undefined);
            if (scope === client_1.TaskAssignmentScope.TEAM && assignee.teamId !== team.id) {
                throw new common_1.BadRequestException({ code: 'TASK_ASSIGNEE_TEAM_MISMATCH', message: 'Assignee must belong to the selected team' });
            }
        }
        return { assignmentScope: scope, teamId: team?.id ?? null, assignedToId: assigneeId };
    }
    assertAssignmentPermission(input, user, operation) {
        const scope = input.assignmentScope
            ?? (input.assigneeId && input.assigneeId !== user.userId
                ? client_1.TaskAssignmentScope.ORGANIZATION
                : client_1.TaskAssignmentScope.SELF);
        const targetsBeyondSelf = scope !== client_1.TaskAssignmentScope.SELF
            || Boolean(input.teamId)
            || Boolean(input.assigneeId && input.assigneeId !== user.userId);
        if (operation === 'assign') {
            if (this.hasPermission(user, 'task:assign'))
                return;
            throw new common_1.ForbiddenException({
                code: 'TASK_ASSIGN_PERMISSION_REQUIRED',
                message: 'برای ارجاع کار به کاربر دیگری، دسترسی task:assign لازم است.',
            });
        }
        if (operation === 'reassign' || operation === 'update') {
            if (this.hasPermission(user, 'task:reassign') || this.hasPermission(user, 'task:assign'))
                return;
            throw new common_1.ForbiddenException({
                code: 'TASK_REASSIGN_PERMISSION_REQUIRED',
                message: 'برای تغییر مسئول کار موجود، دسترسی task:reassign لازم است.',
            });
        }
        if (!targetsBeyondSelf || this.hasPermission(user, 'task:assign'))
            return;
        throw new common_1.ForbiddenException({
            code: 'TASK_ASSIGN_PERMISSION_REQUIRED',
            message: 'برای ارجاع کار به کاربران یا دامنه‌های دیگر، دسترسی task:assign لازم است.',
        });
    }
    assertStatusTransition(from, to) {
        if (from === to)
            return;
        const allowed = {
            [client_1.TaskStatus.TODO]: [client_1.TaskStatus.IN_PROGRESS, client_1.TaskStatus.DONE, client_1.TaskStatus.CANCELLED],
            [client_1.TaskStatus.IN_PROGRESS]: [client_1.TaskStatus.DONE, client_1.TaskStatus.CANCELLED],
            [client_1.TaskStatus.DONE]: [],
            [client_1.TaskStatus.CANCELLED]: [],
        };
        if (!allowed[from].includes(to))
            throw new common_1.BadRequestException({ code: 'INVALID_TASK_TRANSITION', message: `Task cannot transition from ${from} to ${to}` });
    }
    assertTaskOpen(status, message) {
        if (status === client_1.TaskStatus.DONE || status === client_1.TaskStatus.CANCELLED)
            throw new common_1.BadRequestException({ code: 'TASK_CLOSED', message });
    }
    async assertSubtasksResolved(taskId, organizationId) {
        const count = await this.prisma.task.count({
            where: { organizationId, parentTaskId: taskId, status: { notIn: [client_1.TaskStatus.DONE, client_1.TaskStatus.CANCELLED] } },
        });
        if (count)
            throw new common_1.BadRequestException({
                code: 'TASK_INCOMPLETE_SUBTASKS',
                message: `Task cannot be completed while ${count} subtasks are incomplete.`,
                details: { incompleteSubtaskCount: count },
            });
    }
    async taskDepth(task) {
        let depth = 1;
        let parentId = task.parentTaskId;
        const seen = new Set([task.id]);
        while (parentId) {
            if (seen.has(parentId))
                throw new common_1.BadRequestException({ code: 'TASK_HIERARCHY_CYCLE', message: 'Circular task hierarchy detected' });
            seen.add(parentId);
            const parent = await this.prisma.task.findFirst({ where: { id: parentId, organizationId: task.organizationId }, select: { parentTaskId: true } });
            if (!parent)
                throw new common_1.BadRequestException({ code: 'TASK_PARENT_INVALID', message: 'Parent task does not belong to the organization' });
            depth += 1;
            parentId = parent.parentTaskId;
            if (depth > 3)
                break;
        }
        return depth;
    }
    relationSnapshot(task) {
        return {
            companyId: task.companyId, personId: task.personId, opportunityId: task.opportunityId,
            commercialDocumentId: task.commercialDocumentId, paymentId: task.paymentId,
            meetingId: task.meetingId, activityId: task.activityId, productId: task.productId,
        };
    }
    hasPermission(user, permission) {
        return Boolean(user.tenantContext?.permissions?.includes(permission));
    }
    optionPage(data, total, page, limit) {
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    companyScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
            return user.teamId || user.team
                ? { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) }
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
            return user.teamId || user.team
                ? { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } }
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
    async validateAssignee(assignedToId, user, requiredTeamId) {
        const assignee = await this.prisma.user.findFirst({
            where: {
                id: assignedToId,
                ...tenant_scope_util_1.tenantScope.activeMembership(user),
            },
        });
        if (!assignee || !assignee.isActive || assignee.role === client_1.UserRole.BOARDS) {
            throw new common_1.BadRequestException('Task assignee must be an active internal user');
        }
        if (requiredTeamId && assignee.teamId !== requiredTeamId) {
            throw new common_1.BadRequestException({ code: 'TASK_ASSIGNEE_TEAM_MISMATCH', message: 'Assignee must belong to the selected team' });
        }
        return assignee;
    }
    async validateReviewer(reviewerId, assigneeId, user, submitterId) {
        if (reviewerId === assigneeId || reviewerId === submitterId) {
            throw new common_1.BadRequestException({ code: 'TASK_SELF_REVIEW_NOT_ALLOWED', message: 'Assignee or submitter cannot review their own work' });
        }
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const reviewer = await this.prisma.user.findFirst({
            where: { id: reviewerId, organizationId, isActive: true, role: { not: client_1.UserRole.BOARDS } },
            include: {
                organizationMemberships: {
                    where: { organizationId, status: 'ACTIVE' },
                    include: { role: { include: { permissions: { include: { permission: true } } } } },
                },
            },
        });
        if (!reviewer)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEWER_INVALID', message: 'Reviewer must be an active internal user in the same organization' });
        const membershipAllows = reviewer.organizationMemberships.some((membership) => membership.isTenantOwner || membership.role?.permissions.some((item) => item.permission.isActive && item.permission.action === 'task:review'));
        const legacyAllows = await this.prisma.rolePermission.count({ where: { role: reviewer.role, permission: { action: 'task:review', isActive: true } } });
        if (!membershipAllows && !legacyAllows)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEWER_PERMISSION_REQUIRED', message: 'Reviewer does not have task:review permission' });
        return reviewer;
    }
    async validateSubmissionArtifacts(taskId, artifactIds, organizationId) {
        if (!artifactIds.length)
            return;
        const count = await this.prisma.fileAttachment.count({ where: {
                id: { in: artifactIds }, organizationId, deletedAt: null,
                links: { some: { organizationId, entityType: client_1.FileAttachmentEntityType.TASK, entityId: taskId } },
            } });
        if (count !== artifactIds.length)
            throw new common_1.BadRequestException({ code: 'TASK_REVIEW_ARTIFACT_INVALID', message: 'Every submission artifact must be active, tenant-owned and linked to this task' });
    }
    assertReviewApproved(reviewStatus, requiresReview) {
        if (requiresReview && reviewStatus !== client_1.TaskReviewStatus.APPROVED) {
            throw new common_1.BadRequestException({ code: 'TASK_REVIEW_NOT_APPROVED', message: 'Task cannot be completed until the current review is approved' });
        }
    }
    async notifyReviewUser(recipientId, user, task, title, event) {
        await this.notifications.notifyUser({
            organizationId: task.organizationId, recipientId, actorId: user.userId,
            type: client_1.NotificationType.TASK_STATUS_CHANGED, priority: client_1.NotificationPriority.NORMAL,
            title, body: task.title, entityType: client_1.NotificationEntityType.TASK, entityId: task.id,
            actionUrl: `/tasks/${task.id}#review`, metadata: { event }, skipSelf: true,
        });
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
    async notifyTaskAssigned(task, user, title = 'کار جدید به شما ارجاع شد') {
        if (!task.assignedToId) {
            return;
        }
        await this.notifications.notifyUser({
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            recipientId: task.assignedToId,
            actorId: user.userId,
            type: client_1.NotificationType.TASK_ASSIGNED,
            priority: client_1.NotificationPriority.NORMAL,
            title,
            body: task.title,
            entityType: client_1.NotificationEntityType.TASK,
            entityId: task.id,
            actionUrl: `/tasks/${task.id}`,
            skipSelf: true,
        });
    }
    async notifyParentReady(parentTaskId, organizationId, user) {
        const [parent, unresolved] = await Promise.all([
            this.prisma.task.findFirst({ where: { id: parentTaskId, organizationId }, select: { id: true, title: true, assignedToId: true } }),
            this.prisma.task.count({ where: { parentTaskId, organizationId, status: { notIn: [client_1.TaskStatus.DONE, client_1.TaskStatus.CANCELLED] } } }),
        ]);
        if (!parent?.assignedToId || unresolved > 0)
            return;
        await this.notifications.notifyUser({
            organizationId, recipientId: parent.assignedToId, actorId: user.userId,
            type: client_1.NotificationType.TASK_STATUS_CHANGED, priority: client_1.NotificationPriority.NORMAL,
            title: 'همه زیرکارها تعیین تکلیف شدند', body: parent.title,
            entityType: client_1.NotificationEntityType.TASK, entityId: parent.id,
            actionUrl: `/tasks/${parent.id}`, skipSelf: true,
        });
    }
    async notifyTaskCompleted(task, user) {
        if (!task.createdById) {
            return;
        }
        await this.notifications.notifyUser({
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
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
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
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