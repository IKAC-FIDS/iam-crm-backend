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
exports.LeaveRequestService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const notification_core_service_1 = require("../notification-core/notification-core.service");
const prisma_service_1 = require("../prisma/prisma.service");
const timesheet_conflict_service_1 = require("./timesheet-conflict.service");
const timesheet_time_calculation_service_1 = require("./timesheet-time-calculation.service");
const work_schedule_resolver_service_1 = require("./work-schedule-resolver.service");
let LeaveRequestService = class LeaveRequestService {
    constructor(prisma, schedules, clock, conflicts, audit, notifications) {
        this.prisma = prisma;
        this.schedules = schedules;
        this.clock = clock;
        this.conflicts = conflicts;
        this.audit = audit;
        this.notifications = notifications;
    }
    findMine(query, user) {
        return this.list(query, user, { userId: user.userId });
    }
    async findOne(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user), broad = tenant.permissions.includes("leave:view-organization");
        const row = await this.prisma.withTenantTransaction(tenant, (db) => db.leaveRequest.findFirst({
            where: {
                id,
                organizationId: tenant.organizationId,
                ...(broad ? {} : { userId: user.userId }),
            },
            include: { approvalHistory: { orderBy: { createdAt: "asc" } } },
        }));
        if (!row)
            throw new common_1.NotFoundException("Leave request not found");
        return row;
    }
    async create(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const membership = await db.organizationMembership.findFirst({
                where: {
                    id: tenant.membershipId,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                    status: "ACTIVE",
                },
                include: { team: { select: { id: true, code: true, name: true } } },
            });
            if (!membership)
                throw new common_1.BadRequestException({
                    code: "ACTIVE_MEMBERSHIP_REQUIRED",
                    message: "An active organization membership is required",
                });
            const input = await this.prepare(db, dto, tenant.organizationId, membership.id);
            await this.conflicts.assertLeaveAllowed(db, {
                organizationId: tenant.organizationId,
                userId: user.userId,
                ...input,
            }, input.timezone);
            const row = await db.leaveRequest.create({
                data: {
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                    membershipId: membership.id,
                    teamId: membership.team?.id,
                    teamCodeSnapshot: membership.team?.code,
                    teamNameSnapshot: membership.team?.name,
                    type: dto.type,
                    unit: dto.unit,
                    startDate: this.date(input.startDate),
                    endDate: this.date(input.endDate),
                    startMinute: input.startMinute,
                    endMinute: input.endMinute,
                    requestedMinutes: input.requestedMinutes,
                    reason: dto.reason?.trim() || null,
                },
            });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: membership.id,
                organizationId: tenant.organizationId,
                entityType: "leave-request",
                entityId: row.id,
                action: "leave.created",
                after: row,
            }, db);
            return row;
        });
    }
    async update(id, dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const current = await db.leaveRequest.findFirst({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                },
            });
            if (!current)
                throw new common_1.NotFoundException("Leave request not found");
            if (!new Set([client_1.LeaveStatus.DRAFT, client_1.LeaveStatus.REJECTED]).has(current.status))
                throw new common_1.ConflictException({
                    code: "INVALID_LEAVE_STATE",
                    message: "Only draft or rejected leave may be edited",
                });
            const input = await this.prepare(db, dto, tenant.organizationId, current.membershipId, {
                id: current.teamId,
                code: current.teamCodeSnapshot,
                name: current.teamNameSnapshot,
            });
            await this.conflicts.assertLeaveAllowed(db, {
                id,
                organizationId: tenant.organizationId,
                userId: user.userId,
                ...input,
            }, input.timezone);
            const row = await db.leaveRequest.update({
                where: { id },
                data: {
                    type: dto.type,
                    unit: dto.unit,
                    startDate: this.date(input.startDate),
                    endDate: this.date(input.endDate),
                    startMinute: input.startMinute,
                    endMinute: input.endMinute,
                    requestedMinutes: input.requestedMinutes,
                    reason: dto.reason?.trim() || null,
                    ...(current.status === client_1.LeaveStatus.REJECTED
                        ? {
                            status: client_1.LeaveStatus.DRAFT,
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
                entityType: "leave-request",
                entityId: id,
                action: "leave.updated",
                before: current,
                after: row,
            }, db);
            return row;
        });
    }
    submit(id, user) {
        return this.transition(id, user, [client_1.LeaveStatus.DRAFT, client_1.LeaveStatus.REJECTED], client_1.LeaveStatus.PENDING, client_1.TimesheetApprovalAction.SUBMITTED);
    }
    cancel(id, user) {
        return this.transition(id, user, [client_1.LeaveStatus.DRAFT, client_1.LeaveStatus.REJECTED], client_1.LeaveStatus.CANCELLED, client_1.TimesheetApprovalAction.CANCELLED);
    }
    async prepare(db, dto, organizationId, membershipId, historicalTeam) {
        const startDate = dto.startDate.slice(0, 10), endDate = dto.endDate.slice(0, 10);
        if (endDate < startDate)
            throw new common_1.BadRequestException({
                code: "INVALID_DATE_RANGE",
                message: "endDate must not precede startDate",
            });
        const days = this.days(startDate, endDate);
        if (days.length > 366)
            throw new common_1.BadRequestException({
                code: "DATE_RANGE_TOO_LARGE",
                message: "Leave cannot exceed 366 days",
            });
        if (dto.unit === client_1.LeaveUnit.HOURLY &&
            (days.length !== 1 ||
                dto.startMinute == null ||
                dto.endMinute == null ||
                dto.endMinute <= dto.startMinute))
            throw new common_1.BadRequestException({
                code: "INVALID_HOURLY_LEAVE",
                message: "Hourly leave requires one date and a positive local time range",
            });
        if (dto.unit !== client_1.LeaveUnit.HOURLY &&
            (dto.startMinute != null || dto.endMinute != null))
            throw new common_1.BadRequestException({
                code: "INVALID_LEAVE_TIME",
                message: "Only hourly leave accepts start/end minutes",
            });
        let requestedMinutes = 0, timezone = "";
        for (const date of days) {
            const schedule = await this.schedules.resolve(db, {
                organizationId,
                membershipId,
                workDate: date,
                historicalTeam,
            });
            timezone ||= schedule.timezone;
            if (!schedule.scheduleId)
                throw new common_1.BadRequestException({
                    code: "MISSING_WORK_SCHEDULE",
                    message: `برای تاریخ ${date} برنامه کاری معتبری تعریف نشده است. از مدیر سازمان بخواهید در بخش «برنامه کاری سازمان» برنامه‌ای با تاریخ اعتبار مناسب ثبت کند.`,
                });
            if (dto.unit === client_1.LeaveUnit.FULL_DAY)
                requestedMinutes += schedule.expectedRegularMinutes;
            else if (dto.unit === client_1.LeaveUnit.HALF_DAY)
                requestedMinutes += Math.round(schedule.expectedRegularMinutes / 2);
            else {
                if (!schedule.isWorkingDay)
                    throw new common_1.BadRequestException({
                        code: "NON_WORKING_DAY",
                        message: "Hourly leave must be on a working day",
                    });
                const elapsed = this.clock.calculate({
                    workDate: date,
                    timezone: schedule.timezone,
                    startMinute: dto.startMinute,
                    endMinute: dto.endMinute,
                    spansMidnight: false,
                    breakMinutes: 0,
                }).durationMinutes;
                if (elapsed > schedule.expectedRegularMinutes)
                    throw new common_1.BadRequestException({
                        code: "HOURLY_LEAVE_EXCEEDS_SCHEDULE",
                        message: "Hourly leave exceeds scheduled minutes",
                    });
                requestedMinutes += elapsed;
            }
        }
        if (requestedMinutes <= 0)
            throw new common_1.BadRequestException({
                code: "INVALID_LEAVE_DURATION",
                message: "Leave must contain positive scheduled minutes",
            });
        return {
            unit: dto.unit,
            startDate,
            endDate,
            startMinute: dto.startMinute ?? null,
            endMinute: dto.endMinute ?? null,
            requestedMinutes,
            timezone,
        };
    }
    async transition(id, user, from, to, action) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const result = await this.prisma.withTenantTransaction(tenant, async (db) => {
            const current = await db.leaveRequest.findFirst({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                },
            });
            if (!current)
                throw new common_1.NotFoundException("Leave request not found");
            if (to === client_1.LeaveStatus.PENDING &&
                (!current.requestedMinutes || current.requestedMinutes <= 0))
                throw new common_1.BadRequestException({
                    code: "INVALID_LEAVE_DURATION",
                    message: "Submitted leave requires positive requestedMinutes",
                });
            const changed = await db.leaveRequest.updateMany({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    userId: user.userId,
                    status: { in: from },
                },
                data: {
                    status: to,
                    ...(to === client_1.LeaveStatus.PENDING
                        ? { submittedAt: new Date(), rejectionReason: null }
                        : {}),
                },
            });
            if (changed.count !== 1)
                throw new common_1.ConflictException({
                    code: "INVALID_LEAVE_STATE",
                    message: `Leave cannot transition from ${current.status} to ${to}`,
                });
            const historyAction = current.status === client_1.LeaveStatus.REJECTED && to === client_1.LeaveStatus.PENDING
                ? client_1.TimesheetApprovalAction.RESUBMITTED
                : action;
            await db.timesheetApprovalHistory.create({
                data: {
                    organizationId: tenant.organizationId,
                    leaveRequestId: id,
                    actorMembershipId: tenant.membershipId,
                    action: historyAction,
                    fromStatus: current.status,
                    toStatus: to,
                },
            });
            const row = await db.leaveRequest.findUniqueOrThrow({ where: { id } });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: tenant.membershipId,
                organizationId: tenant.organizationId,
                entityType: "leave-request",
                entityId: id,
                action: `leave.${to.toLowerCase()}`,
                before: { status: current.status },
                after: { status: to },
            }, db);
            return row;
        });
        if (to === client_1.LeaveStatus.PENDING)
            await this.notifications.publishDomainEvent({
                organizationId: tenant.organizationId,
                eventName: "LEAVE.REQUESTED",
                aggregateType: "LEAVE_REQUEST",
                aggregateId: id,
                actorId: user.userId,
                idempotencyKey: `LEAVE.REQUESTED:${id}:${result.submittedAt?.toISOString()}`,
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
                startDate: {
                    ...(query.endDate && { lte: this.date(query.endDate.slice(0, 10)) }),
                },
                endDate: {
                    ...(query.startDate && {
                        gte: this.date(query.startDate.slice(0, 10)),
                    }),
                },
            }),
        };
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const [data, total] = await Promise.all([
                db.leaveRequest.findMany({
                    where,
                    orderBy: { startDate: query.sort ?? "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                    include: { reviewedByMembership: { select: { user: { select: { fullName: true } } } }, approvalHistory: { orderBy: { createdAt: 'asc' }, take: 100, include: { actorMembership: { select: { user: { select: { fullName: true } } } } } } },
                }),
                db.leaveRequest.count({ where }),
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
    days(start, end) {
        const result = [];
        for (let d = start; d <= end; d = this.addDays(d, 1))
            result.push(d);
        return result;
    }
    addDays(value, count) {
        const d = this.date(value);
        d.setUTCDate(d.getUTCDate() + count);
        return d.toISOString().slice(0, 10);
    }
    date(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }
};
exports.LeaveRequestService = LeaveRequestService;
exports.LeaveRequestService = LeaveRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        work_schedule_resolver_service_1.WorkScheduleResolverService,
        timesheet_time_calculation_service_1.TimesheetTimeCalculationService,
        timesheet_conflict_service_1.TimesheetConflictService,
        audit_log_service_1.AuditLogService,
        notification_core_service_1.NotificationCoreService])
], LeaveRequestService);
//# sourceMappingURL=leave-request.service.js.map