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
exports.TimesheetService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const notification_core_service_1 = require("../notification-core/notification-core.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const company_access_service_1 = require("../companies/company-access.service");
const timesheet_conflict_service_1 = require("./timesheet-conflict.service");
const timesheet_time_calculation_service_1 = require("./timesheet-time-calculation.service");
const work_schedule_resolver_service_1 = require("./work-schedule-resolver.service");
let TimesheetService = class TimesheetService {
    constructor(prisma, schedules, clock, conflicts, audit, notifications, tasks, companies) {
        this.prisma = prisma;
        this.schedules = schedules;
        this.clock = clock;
        this.conflicts = conflicts;
        this.audit = audit;
        this.notifications = notifications;
        this.tasks = tasks;
        this.companies = companies;
    }
    findMine(query, user) {
        return this.list(query, user, { userId: user.userId });
    }
    async findOne(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user), broad = tenant.permissions.includes("timesheet:view-organization");
        const row = await this.prisma.withTenantTransaction(tenant, (db) => db.timesheetEntry.findFirst({
            where: {
                id,
                organizationId: tenant.organizationId,
                ...(broad ? {} : { userId: user.userId }),
            },
            include: { approvalHistory: { orderBy: { createdAt: "asc" } } },
        }));
        if (!row)
            throw new common_1.NotFoundException("Timesheet entry not found");
        return row;
    }
    async create(dto, user) {
        await this.references(dto, user);
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const membership = await this.membership(db, tenant.membershipId, tenant.organizationId, user.userId);
            const workDate = dto.workDate.slice(0, 10), schedule = await this.schedules.resolve(db, {
                organizationId: tenant.organizationId,
                membershipId: membership.id,
                workDate,
            });
            const time = this.clock.calculate({
                ...dto,
                workDate,
                timezone: schedule.timezone,
            });
            await this.conflicts.assertWorkAllowed(db, {
                organizationId: tenant.organizationId,
                userId: user.userId,
                workDate,
                startMinute: time.startMinute,
                endMinute: time.endMinute,
                spansMidnight: time.spansMidnight,
            }, schedule.timezone);
            const row = await db.timesheetEntry.create({
                data: {
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                    membershipId: membership.id,
                    teamId: membership.team?.id,
                    teamCodeSnapshot: membership.team?.code,
                    teamNameSnapshot: membership.team?.name,
                    workDate: this.date(workDate),
                    startMinute: time.startMinute,
                    endMinute: time.endMinute,
                    spansMidnight: time.spansMidnight,
                    durationMinutes: time.durationMinutes,
                    breakMinutes: time.breakMinutes,
                    type: dto.type,
                    description: dto.description?.trim() || null,
                    taskId: dto.taskId,
                    companyId: dto.companyId,
                },
            });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: membership.id,
                organizationId: tenant.organizationId,
                entityType: "timesheet",
                entityId: row.id,
                action: "timesheet.created",
                after: row,
            }, db);
            return row;
        });
    }
    async update(id, dto, user) {
        await this.references(dto, user);
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const current = await db.timesheetEntry.findFirst({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                },
            });
            if (!current)
                throw new common_1.NotFoundException("Timesheet entry not found");
            if (!new Set([
                client_1.TimeEntryStatus.DRAFT,
                client_1.TimeEntryStatus.REJECTED,
            ]).has(current.status))
                throw new common_1.ConflictException({
                    code: "INVALID_TIMESHEET_STATE",
                    message: "Only draft or rejected entries may be edited",
                });
            const workDate = dto.workDate.slice(0, 10), schedule = await this.schedules.resolve(db, {
                organizationId: tenant.organizationId,
                membershipId: current.membershipId,
                workDate,
                historicalTeam: {
                    id: current.teamId,
                    code: current.teamCodeSnapshot,
                    name: current.teamNameSnapshot,
                },
            });
            const time = this.clock.calculate({
                ...dto,
                workDate,
                timezone: schedule.timezone,
            });
            await this.conflicts.assertWorkAllowed(db, {
                id,
                organizationId: tenant.organizationId,
                userId: user.userId,
                workDate,
                startMinute: time.startMinute,
                endMinute: time.endMinute,
                spansMidnight: time.spansMidnight,
            }, schedule.timezone);
            const row = await db.timesheetEntry.update({
                where: { id },
                data: {
                    workDate: this.date(workDate),
                    startMinute: time.startMinute,
                    endMinute: time.endMinute,
                    spansMidnight: time.spansMidnight,
                    durationMinutes: time.durationMinutes,
                    breakMinutes: time.breakMinutes,
                    type: dto.type,
                    description: dto.description?.trim() || null,
                    taskId: dto.taskId ?? null,
                    companyId: dto.companyId ?? null,
                    ...(current.status === client_1.TimeEntryStatus.REJECTED
                        ? {
                            status: client_1.TimeEntryStatus.DRAFT,
                            rejectionReason: null,
                            reviewedAt: null,
                            reviewedByMembershipId: null,
                        }
                        : {}),
                },
            });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: tenant.membershipId,
                organizationId: tenant.organizationId,
                entityType: "timesheet",
                entityId: id,
                action: "timesheet.updated",
                before: current,
                after: row,
            }, db);
            return row;
        });
    }
    submit(id, user) {
        return this.transition(id, user, [client_1.TimeEntryStatus.DRAFT, client_1.TimeEntryStatus.REJECTED], client_1.TimeEntryStatus.SUBMITTED, client_1.TimesheetApprovalAction.SUBMITTED);
    }
    cancel(id, user) {
        return this.transition(id, user, [client_1.TimeEntryStatus.DRAFT, client_1.TimeEntryStatus.REJECTED], client_1.TimeEntryStatus.CANCELLED, client_1.TimesheetApprovalAction.CANCELLED);
    }
    async transition(id, user, from, to, action) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const result = await this.prisma.withTenantTransaction(tenant, async (db) => {
            const current = await db.timesheetEntry.findFirst({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                },
            });
            if (!current)
                throw new common_1.NotFoundException("Timesheet entry not found");
            const updated = await db.timesheetEntry.updateMany({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                    status: { in: from },
                },
                data: {
                    status: to,
                    ...(to === client_1.TimeEntryStatus.SUBMITTED
                        ? { submittedAt: new Date(), rejectionReason: null }
                        : {}),
                },
            });
            if (updated.count !== 1)
                throw new common_1.ConflictException({
                    code: "INVALID_TIMESHEET_STATE",
                    message: `Timesheet cannot transition from ${current.status} to ${to}`,
                });
            const historyAction = current.status === client_1.TimeEntryStatus.REJECTED &&
                to === client_1.TimeEntryStatus.SUBMITTED
                ? client_1.TimesheetApprovalAction.RESUBMITTED
                : action;
            await db.timesheetApprovalHistory.create({
                data: {
                    organizationId: tenant.organizationId,
                    timesheetEntryId: id,
                    actorMembershipId: tenant.membershipId,
                    action: historyAction,
                    fromStatus: current.status,
                    toStatus: to,
                },
            });
            const row = await db.timesheetEntry.findUniqueOrThrow({ where: { id } });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: tenant.membershipId,
                organizationId: tenant.organizationId,
                entityType: "timesheet",
                entityId: id,
                action: `timesheet.${to.toLowerCase()}`,
                before: { status: current.status },
                after: { status: to },
            }, db);
            return row;
        });
        const event = `${result.type === "OVERTIME" ? "OVERTIME" : "TIMESHEET"}.${to}`;
        if (to === client_1.TimeEntryStatus.SUBMITTED)
            await this.notifications.publishDomainEvent({
                organizationId: tenant.organizationId,
                eventName: event,
                aggregateType: "TIMESHEET",
                aggregateId: id,
                actorId: user.userId,
                idempotencyKey: `${event}:${id}:${result.submittedAt?.toISOString()}`,
                payload: { creatorUserId: user.userId, teamId: result.teamId },
            });
        return result;
    }
    async list(query, user, scope) {
        const tenant = tenant_scope_util_1.tenantScope.require(user), page = query.page ?? 1, limit = query.limit ?? 20;
        const where = {
            organizationId: tenant.organizationId,
            ...scope,
            ...(query.type && { type: query.type }),
            ...(query.status && { status: query.status }),
            ...((query.startDate || query.endDate) && {
                workDate: {
                    ...(query.startDate && {
                        gte: this.date(query.startDate.slice(0, 10)),
                    }),
                    ...(query.endDate && { lte: this.date(query.endDate.slice(0, 10)) }),
                },
            }),
        };
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const [data, total] = await Promise.all([
                db.timesheetEntry.findMany({
                    where,
                    orderBy: { workDate: query.sort ?? "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                db.timesheetEntry.count({ where }),
            ]);
            return {
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrevious: page > 1,
                },
            };
        });
    }
    async references(dto, user) {
        if (dto.taskId)
            await this.tasks.assertReadable(dto.taskId, user);
        if (dto.companyId)
            await this.companies.assertCompanyReadable(dto.companyId, user);
    }
    async membership(db, id, organizationId, userId) {
        const row = await db.organizationMembership.findFirst({
            where: { id, organizationId, userId, status: "ACTIVE" },
            include: { team: { select: { id: true, code: true, name: true } } },
        });
        if (!row)
            throw new common_1.BadRequestException({
                code: "ACTIVE_MEMBERSHIP_REQUIRED",
                message: "An active organization membership is required",
            });
        return row;
    }
    date(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }
};
exports.TimesheetService = TimesheetService;
exports.TimesheetService = TimesheetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        work_schedule_resolver_service_1.WorkScheduleResolverService,
        timesheet_time_calculation_service_1.TimesheetTimeCalculationService,
        timesheet_conflict_service_1.TimesheetConflictService,
        audit_log_service_1.AuditLogService,
        notification_core_service_1.NotificationCoreService,
        tasks_service_1.TasksService,
        company_access_service_1.CompanyAccessService])
], TimesheetService);
//# sourceMappingURL=timesheet.service.js.map