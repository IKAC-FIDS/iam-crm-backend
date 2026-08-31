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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const api_date_util_1 = require("../common/dates/api-date.util");
const company_access_service_1 = require("../companies/company-access.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const api_date_util_2 = require("../common/dates/api-date.util");
const find_activities_dto_1 = require("./dto/find-activities.dto");
const activityCenterSelect = {
    id: true,
    targetType: true,
    taskId: true,
    companyId: true,
    personId: true,
    opportunityId: true,
    type: true,
    notes: true,
    outcome: true,
    occurredAt: true,
    nextActionDate: true,
    completedAt: true,
    createdAt: true,
    person: { select: { id: true, fullName: true } },
    company: {
        select: {
            id: true,
            legalName: true,
            brandName: true,
            owner: { select: { id: true, fullName: true, email: true, team: true, teamId: true } },
        },
    },
    task: {
        select: {
            id: true,
            title: true,
            status: true,
            parentTaskId: true,
            parentTask: { select: { id: true, title: true } },
        },
    },
    user: { select: { id: true, fullName: true, email: true } },
};
let ActivitiesService = class ActivitiesService {
    constructor(prisma, audit, companyAccess) {
        this.prisma = prisma;
        this.audit = audit;
        this.companyAccess = companyAccess;
    }
    findTypes() {
        return this.prisma.lookupOption.findMany({
            where: { group: 'activity-types' },
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        });
    }
    async validateManualType(type) {
        if (type === 'STAGE_CHANGE')
            throw new common_1.BadRequestException('STAGE_CHANGE is a system activity');
        const option = await this.prisma.lookupOption.findFirst({
            where: { group: 'activity-types', code: type, isActive: true },
        });
        if (!option)
            throw new common_1.BadRequestException('نوع فعالیت انتخاب‌شده نامعتبر یا غیرفعال است.');
    }
    async findAll(query, user) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = this.activityCenterWhere(query, user);
        const primaryOrder = query.sortBy === 'createdAt'
            ? { createdAt: query.sortOrder ?? 'desc' }
            : { occurredAt: query.sortOrder ?? 'desc' };
        const orderDirection = query.sortOrder ?? 'desc';
        const orderBy = query.sortBy === 'createdAt'
            ? [primaryOrder, { id: orderDirection }]
            : [primaryOrder, { createdAt: orderDirection }, { id: orderDirection }];
        const [rows, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                select: activityCenterSelect,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.activity.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: rows.map((row) => this.activityCenterRow(row)),
            meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
        };
    }
    async latestActivities(user) {
        const rows = await this.prisma.activity.findMany({
            where: this.activityCenterWhere({}, user),
            select: activityCenterSelect,
            orderBy: { occurredAt: 'desc' },
            take: 10,
        });
        return rows.map((row) => {
            const mapped = this.activityCenterRow(row);
            return {
                id: mapped.id,
                type: mapped.type,
                title: mapped.title,
                activityDate: mapped.activityDate,
                person: mapped.person,
                company: mapped.company,
                task: mapped.task,
                targetType: mapped.targetType,
                createdBy: mapped.createdBy,
            };
        });
    }
    activityCenterWhere(query, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const and = [
            {
                OR: [
                    { company: { organizationId, archivedAt: null } },
                    { task: { organizationId } },
                ],
            },
        ];
        if (query.activityType)
            and.push({ type: query.activityType });
        if (query.status === find_activities_dto_1.ActivityListStatus.COMPLETED)
            and.push({ completedAt: { not: null } });
        else if (query.status === find_activities_dto_1.ActivityListStatus.RECORDED)
            and.push({ completedAt: null });
        if (query.ownerId)
            and.push({ company: { ownerId: query.ownerId } });
        if (query.createdById)
            and.push({ userId: query.createdById });
        if (query.personId)
            and.push({ personId: query.personId });
        if (query.companyId)
            and.push({ companyId: query.companyId });
        const activityDate = (0, api_date_util_2.parseApiDateRange)(query.dateFrom, query.dateTo, 'dateFrom', 'dateTo');
        if (activityDate)
            and.push({ occurredAt: activityDate });
        if (query.team?.trim())
            and.push({ company: { owner: (0, team_scope_util_1.userTeamFilterWhere)([query.team]) } });
        if (query.ownershipScope === ownership_scope_dto_1.OwnershipScope.MINE)
            and.push({ company: { ownerId: user.userId } });
        else if (query.ownershipScope === ownership_scope_dto_1.OwnershipScope.TEAM)
            and.push({ company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } });
        else if (query.ownershipScope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED)
            and.push({ company: { ownerId: null } });
        if (query.mine)
            and.push({ userId: user.userId });
        if (query.unassigned)
            and.push({ company: { ownerId: null } });
        const search = query.search?.trim();
        if (search) {
            and.push({
                OR: [
                    { outcome: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                    { person: { fullName: { contains: search, mode: 'insensitive' } } },
                    { company: { legalName: { contains: search, mode: 'insensitive' } } },
                    { company: { brandName: { contains: search, mode: 'insensitive' } } },
                    { task: { title: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }
        return { AND: and };
    }
    activityCenterRow(row) {
        const company = row.company
            ? (() => {
                const { owner: _owner, ...value } = row.company;
                return value;
            })()
            : null;
        return {
            ...row,
            title: row.outcome ?? row.type,
            description: row.notes,
            status: row.completedAt ? find_activities_dto_1.ActivityListStatus.COMPLETED : find_activities_dto_1.ActivityListStatus.RECORDED,
            activityDate: row.occurredAt,
            updatedAt: row.createdAt,
            company,
            owner: row.company?.owner ?? null,
            createdBy: row.user,
        };
    }
    async validateCompanyAccess(companyId, user) {
        await this.companyAccess.assertCompanyMutable(companyId, user);
    }
    async validatePersonAccess(personId, user) {
        const person = await this.prisma.person.findFirst({
            where: { id: personId, company: { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) } },
            include: { company: { select: { ownerId: true, owner: { select: { team: true, teamId: true } } } } },
        });
        if (!person)
            throw new common_1.NotFoundException('مخاطب پیدا نشد');
        await this.validateCompanyAccess(person.companyId, user);
        return person;
    }
    taskScopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS)
            return {};
        if (user.role === client_1.UserRole.MANAGER) {
            if (!user.teamId && !user.team)
                return { id: { in: [] } };
            return {
                OR: [
                    { assignedTo: (0, team_scope_util_1.userTeamScopeWhere)(user) },
                    { createdBy: (0, team_scope_util_1.userTeamScopeWhere)(user) },
                    { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } },
                    { opportunity: { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } } },
                    { person: { company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } } },
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
                        OR: [{ ownerId: user.userId }, { company: { ownerId: user.userId } }],
                    },
                },
                { person: { company: { ownerId: user.userId } } },
            ],
        };
    }
    async validateTaskAccess(taskId, user, forCreate = false) {
        const task = await this.prisma.task.findFirst({
            where: {
                AND: [
                    { id: taskId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                    this.taskScopeWhere(user),
                ],
            },
            select: {
                id: true,
                title: true,
                status: true,
                companyId: true,
                personId: true,
                opportunityId: true,
                parentTaskId: true,
                company: { select: { id: true, legalName: true, brandName: true } },
                parentTask: { select: { id: true, title: true } },
            },
        });
        if (!task)
            throw new common_1.NotFoundException('Task not found');
        if (forCreate && (task.status === client_1.TaskStatus.DONE || task.status === client_1.TaskStatus.CANCELLED)) {
            throw new common_1.BadRequestException({
                code: 'ACTIVITY_TASK_CLOSED',
                message: 'برای کار تکمیل‌شده یا لغوشده نمی‌توان فعالیت جدید ثبت کرد.',
            });
        }
        return task;
    }
    async findActivityForMutation(activityId, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const activity = await this.prisma.activity.findFirst({
            where: {
                id: activityId,
                OR: [{ company: { organizationId } }, { task: { organizationId } }],
            },
            include: {
                company: true,
                task: true,
                person: true,
                user: { select: { id: true, fullName: true } },
                completedBy: { select: { id: true, fullName: true } },
            },
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
        if (activity.targetType === client_1.ActivityTargetType.TASK && activity.taskId) {
            await this.validateTaskAccess(activity.taskId, user);
        }
        else if (activity.companyId) {
            await this.validateCompanyAccess(activity.companyId, user);
        }
        else {
            throw new common_1.ForbiddenException('Activity target is not accessible');
        }
        return activity;
    }
    async findByCompany(companyId, pagination, user) {
        if (!companyId)
            throw new common_1.BadRequestException('شناسه شرکت الزامی است');
        await this.assertCompanyReadable(companyId, user);
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.activity.findMany({
                where: { companyId },
                include: {
                    person: true,
                    task: {
                        select: {
                            id: true,
                            title: true,
                            parentTaskId: true,
                            parentTask: { select: { id: true, title: true } },
                        },
                    },
                    user: { select: { id: true, fullName: true } },
                },
                orderBy: { occurredAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.activity.count({ where: { companyId } }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
        };
    }
    async findByTask(taskId, pagination, includeSubtasks, user) {
        await this.validateTaskAccess(taskId, user);
        const taskIds = [taskId];
        if (includeSubtasks) {
            let frontier = [taskId];
            for (let depth = 0; depth < 3 && frontier.length; depth += 1) {
                const children = await this.prisma.task.findMany({
                    where: { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), parentTaskId: { in: frontier } },
                    select: { id: true },
                });
                const next = children.map((row) => row.id).filter((id) => !taskIds.includes(id));
                taskIds.push(...next);
                frontier = next;
            }
        }
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const where = {
            targetType: client_1.ActivityTargetType.TASK,
            taskId: { in: taskIds },
        };
        const [data, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                select: activityCenterSelect,
                orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.activity.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: data.map((row) => this.activityCenterRow(row)),
            meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
        };
    }
    async create(dto, user) {
        await this.validateManualType(dto.type);
        const targetType = dto.targetType ?? client_1.ActivityTargetType.COMPANY;
        let companyId = null;
        let taskId = null;
        let personId = dto.personId;
        let opportunityId = dto.opportunityId;
        if (targetType === client_1.ActivityTargetType.COMPANY) {
            if (!dto.companyId) {
                throw new common_1.BadRequestException({
                    code: 'ACTIVITY_COMPANY_REQUIRED',
                    message: 'برای فعالیت شرکتی، انتخاب شرکت الزامی است.',
                });
            }
            if (dto.taskId) {
                throw new common_1.BadRequestException({
                    code: 'ACTIVITY_TARGET_INVALID',
                    message: 'فعالیت شرکتی نمی‌تواند هم‌زمان به کار متصل باشد.',
                });
            }
            companyId = dto.companyId;
            await this.validateCompanyAccess(companyId, user);
            if (personId) {
                const person = await this.validatePersonAccess(personId, user);
                if (person.companyId !== companyId) {
                    throw new common_1.BadRequestException('Person must belong to the activity company');
                }
            }
            if (opportunityId) {
                await this.validateOpportunityCompany(opportunityId, companyId);
            }
        }
        else {
            if (!dto.taskId) {
                throw new common_1.BadRequestException({
                    code: 'ACTIVITY_TASK_REQUIRED',
                    message: 'برای فعالیت مرتبط با کار، انتخاب کار الزامی است.',
                });
            }
            if (dto.companyId) {
                throw new common_1.BadRequestException({
                    code: 'ACTIVITY_TARGET_INVALID',
                    message: 'companyId برای فعالیت مبتنی بر کار از سمت سرور تعیین می‌شود.',
                });
            }
            const task = await this.validateTaskAccess(dto.taskId, user, true);
            taskId = task.id;
            companyId = task.companyId ?? null;
            personId = personId ?? task.personId ?? undefined;
            opportunityId = opportunityId ?? task.opportunityId ?? undefined;
            if (personId && companyId) {
                const person = await this.validatePersonAccess(personId, user);
                if (person.companyId !== companyId) {
                    throw new common_1.BadRequestException('Person must belong to the task company');
                }
            }
            if (opportunityId && companyId) {
                await this.validateOpportunityCompany(opportunityId, companyId);
            }
        }
        const activity = await this.prisma.activity.create({
            data: {
                targetType,
                companyId,
                taskId,
                personId,
                userId: user.userId,
                type: dto.type,
                notes: dto.notes,
                outcome: dto.outcome,
                occurredAt: dto.occurredAt ? (0, api_date_util_1.parseApiDate)(dto.occurredAt, 'occurredAt') : undefined,
                nextActionDate: dto.nextActionDate ? (0, api_date_util_1.parseApiDate)(dto.nextActionDate, 'nextActionDate') : undefined,
                opportunityId,
            },
            include: {
                company: true,
                task: {
                    select: {
                        id: true,
                        title: true,
                        parentTaskId: true,
                        parentTask: { select: { id: true, title: true } },
                    },
                },
                person: true,
                user: { select: { id: true, fullName: true } },
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'activity',
            entityId: activity.id,
            action: 'activity.created',
            after: activity,
            metadata: { targetType, companyId, taskId },
        });
        return activity;
    }
    async assertCompanyReadable(companyId, user) {
        await this.companyAccess.assertCompanyReadable(companyId, user);
    }
    async updateActivity(activityId, dto, user) {
        const activity = await this.findActivityForMutation(activityId, user);
        if (dto.type !== undefined && dto.type !== activity.type) {
            await this.validateManualType(dto.type);
        }
        if (activity.type === 'STAGE_CHANGE') {
            throw new common_1.BadRequestException('STAGE_CHANGE activities cannot be edited manually');
        }
        if (dto.type === 'STAGE_CHANGE') {
            throw new common_1.BadRequestException('Activity type cannot be changed to STAGE_CHANGE manually');
        }
        if (dto.personId) {
            const person = await this.validatePersonAccess(dto.personId, user);
            if (activity.companyId && person.companyId !== activity.companyId) {
                throw new common_1.BadRequestException('Person must belong to the activity company');
            }
        }
        if (dto.opportunityId && activity.companyId) {
            await this.validateOpportunityCompany(dto.opportunityId, activity.companyId);
        }
        const updated = await this.prisma.activity.update({
            where: { id: activityId },
            data: {
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.personId !== undefined && { personId: dto.personId }),
                ...(dto.occurredAt != null && { occurredAt: (0, api_date_util_1.parseApiDate)(dto.occurredAt, 'occurredAt') }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.outcome !== undefined && { outcome: dto.outcome }),
                ...(dto.nextActionDate !== undefined && {
                    nextActionDate: (0, api_date_util_1.parseNullableApiDate)(dto.nextActionDate, 'nextActionDate'),
                }),
                ...(dto.opportunityId !== undefined && { opportunityId: dto.opportunityId }),
            },
            include: {
                company: true,
                task: true,
                person: true,
                user: { select: { id: true, fullName: true } },
                completedBy: { select: { id: true, fullName: true } },
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'activity',
            entityId: activityId,
            action: 'activity.updated',
            before: activity,
            after: updated,
        });
        return updated;
    }
    async completeActivity(activityId, dto, user) {
        const activity = await this.findActivityForMutation(activityId, user);
        if (!activity.nextActionDate) {
            throw new common_1.BadRequestException('Only activities with a follow-up date can be completed');
        }
        if (activity.completedAt)
            return activity;
        const completed = await this.prisma.activity.update({
            where: { id: activityId },
            data: {
                completedAt: new Date(),
                completedById: user.userId,
                completionNote: dto.completionNote,
                ...(dto.outcome !== undefined && { outcome: dto.outcome }),
            },
            include: {
                company: true,
                task: true,
                person: true,
                user: { select: { id: true, fullName: true } },
                completedBy: { select: { id: true, fullName: true } },
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'activity',
            entityId: activityId,
            action: 'follow-up.completed',
            before: activity,
            after: completed,
        });
        return completed;
    }
    async rescheduleActivity(activityId, dto, user) {
        const activity = await this.findActivityForMutation(activityId, user);
        if (activity.completedAt) {
            throw new common_1.BadRequestException('Completed follow-ups cannot be rescheduled');
        }
        const nextActionDate = (0, api_date_util_1.parseApiDate)(dto.nextActionDate, 'nextActionDate');
        if (nextActionDate <= new Date()) {
            throw new common_1.BadRequestException('nextActionDate must be in the future');
        }
        const note = dto.note?.trim();
        const notes = note
            ? [activity.notes, `[Rescheduled] ${note}`].filter(Boolean).join('\n')
            : activity.notes;
        const rescheduled = await this.prisma.activity.update({
            where: { id: activityId },
            data: { nextActionDate, notes },
            include: {
                company: true,
                task: true,
                person: true,
                user: { select: { id: true, fullName: true } },
                completedBy: { select: { id: true, fullName: true } },
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'activity',
            entityId: activityId,
            action: 'follow-up.rescheduled',
            before: activity,
            after: rescheduled,
        });
        return rescheduled;
    }
    async findDueFollowUps(user, pagination) {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const where = {
            userId: user.userId,
            OR: [{ company: { organizationId } }, { task: { organizationId } }],
            nextActionDate: { lte: new Date() },
            completedAt: null,
        };
        const [data, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                include: {
                    company: { select: { id: true, legalName: true } },
                    task: { select: { id: true, title: true } },
                    person: true,
                },
                orderBy: { nextActionDate: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.activity.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
        };
    }
    async validateOpportunityCompany(opportunityId, companyId) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: { id: opportunityId, companyId },
            select: { companyId: true },
        });
        if (!opportunity)
            throw new common_1.NotFoundException('Opportunity not found');
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        company_access_service_1.CompanyAccessService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map