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
exports.TimesheetApprovalService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const notification_core_service_1 = require("../notification-core/notification-core.service");
const prisma_service_1 = require("../prisma/prisma.service");
let TimesheetApprovalService = class TimesheetApprovalService {
    constructor(prisma, audit, notifications) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
    }
    listTimesheets(query, user) {
        return this.list("timesheet", query, user);
    }
    listLeave(query, user) {
        return this.list("leave", query, user);
    }
    approveTimesheet(id, user) {
        return this.decideTimesheet(id, true, undefined, user);
    }
    rejectTimesheet(id, reason, user) {
        return this.decideTimesheet(id, false, reason, user);
    }
    approveLeave(id, user) {
        return this.decideLeave(id, true, undefined, user);
    }
    rejectLeave(id, reason, user) {
        return this.decideLeave(id, false, reason, user);
    }
    async decideTimesheet(id, approve, reason, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user), target = approve ? client_1.TimeEntryStatus.APPROVED : client_1.TimeEntryStatus.REJECTED;
        const result = await this.prisma.withTenantTransaction(tenant, async (db) => {
            const row = await db.timesheetEntry.findFirst({
                where: { id, organizationId: tenant.organizationId },
            });
            if (!row)
                throw new common_1.NotFoundException("Timesheet entry not found");
            await this.authorize(db, row.userId, row.teamId, user, "timesheet");
            const changed = await db.timesheetEntry.updateMany({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    status: client_1.TimeEntryStatus.SUBMITTED,
                },
                data: {
                    status: target,
                    reviewedByMembershipId: tenant.membershipId,
                    reviewedAt: new Date(),
                    rejectionReason: approve ? null : reason,
                },
            });
            if (changed.count !== 1)
                throw new common_1.ConflictException({
                    code: "CONCURRENT_DECISION_CONFLICT",
                    message: "Timesheet is no longer submitted",
                });
            await db.timesheetApprovalHistory.create({
                data: {
                    organizationId: tenant.organizationId,
                    timesheetEntryId: id,
                    actorMembershipId: tenant.membershipId,
                    action: approve
                        ? client_1.TimesheetApprovalAction.APPROVED
                        : client_1.TimesheetApprovalAction.REJECTED,
                    fromStatus: client_1.TimeEntryStatus.SUBMITTED,
                    toStatus: target,
                    reason,
                },
            });
            const updated = await db.timesheetEntry.findUniqueOrThrow({
                where: { id },
            });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: tenant.membershipId,
                organizationId: tenant.organizationId,
                entityType: "timesheet",
                entityId: id,
                action: `timesheet.${target.toLowerCase()}`,
                before: { status: row.status },
                after: {
                    status: target,
                    reviewerMembershipId: tenant.membershipId,
                },
                metadata: { outcome: target, reason },
            }, db);
            return updated;
        });
        const event = `${result.type === "OVERTIME" ? "OVERTIME" : "TIMESHEET"}.${target}`;
        await this.notifications.publishDomainEvent({
            organizationId: tenant.organizationId,
            eventName: event,
            aggregateType: "TIMESHEET",
            aggregateId: id,
            actorId: user.userId,
            idempotencyKey: `${event}:${id}:${result.reviewedAt?.toISOString()}`,
            payload: { ownerUserId: result.userId, creatorUserId: result.userId },
        });
        return result;
    }
    async decideLeave(id, approve, reason, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user), target = approve ? client_1.LeaveStatus.APPROVED : client_1.LeaveStatus.REJECTED;
        const result = await this.prisma.withTenantTransaction(tenant, async (db) => {
            const row = await db.leaveRequest.findFirst({
                where: { id, organizationId: tenant.organizationId },
            });
            if (!row)
                throw new common_1.NotFoundException("Leave request not found");
            await this.authorize(db, row.userId, row.teamId, user, "leave");
            const changed = await db.leaveRequest.updateMany({
                where: {
                    id,
                    organizationId: tenant.organizationId,
                    status: client_1.LeaveStatus.PENDING,
                },
                data: {
                    status: target,
                    reviewedByMembershipId: tenant.membershipId,
                    reviewedAt: new Date(),
                    rejectionReason: approve ? null : reason,
                },
            });
            if (changed.count !== 1)
                throw new common_1.ConflictException({
                    code: "CONCURRENT_DECISION_CONFLICT",
                    message: "Leave request is no longer pending",
                });
            await db.timesheetApprovalHistory.create({
                data: {
                    organizationId: tenant.organizationId,
                    leaveRequestId: id,
                    actorMembershipId: tenant.membershipId,
                    action: approve
                        ? client_1.TimesheetApprovalAction.APPROVED
                        : client_1.TimesheetApprovalAction.REJECTED,
                    fromStatus: client_1.LeaveStatus.PENDING,
                    toStatus: target,
                    reason,
                },
            });
            const updated = await db.leaveRequest.findUniqueOrThrow({
                where: { id },
            });
            await this.audit.record({
                actorId: user.userId,
                actorMembershipId: tenant.membershipId,
                organizationId: tenant.organizationId,
                entityType: "leave-request",
                entityId: id,
                action: `leave.${target.toLowerCase()}`,
                before: { status: row.status },
                after: {
                    status: target,
                    reviewerMembershipId: tenant.membershipId,
                },
                metadata: { outcome: target, reason },
            }, db);
            return updated;
        });
        const event = `LEAVE.${target}`;
        await this.notifications.publishDomainEvent({
            organizationId: tenant.organizationId,
            eventName: event,
            aggregateType: "LEAVE_REQUEST",
            aggregateId: id,
            actorId: user.userId,
            idempotencyKey: `${event}:${id}:${result.reviewedAt?.toISOString()}`,
            payload: { ownerUserId: result.userId, creatorUserId: result.userId },
        });
        return result;
    }
    async authorize(db, employeeUserId, teamId, user, domain) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        if (employeeUserId === user.userId)
            throw new common_1.ForbiddenException({
                code: "SELF_APPROVAL_FORBIDDEN",
                message: "Self approval is not permitted",
            });
        const broad = tenant.permissions.includes(`${domain}:approve-organization`);
        if (broad)
            return;
        if (!tenant.permissions.includes(`${domain}:approve`))
            throw new common_1.ForbiddenException("Approval permission is required");
        if (!teamId)
            throw new common_1.ForbiddenException({
                code: "OUTSIDE_MANAGER_SCOPE",
                message: "Employee is not assigned to a managed team",
            });
        const team = await db.team.findFirst({
            where: {
                id: teamId,
                organizationId: tenant.organizationId,
                managerId: user.userId,
                isActive: true,
            },
            select: { id: true },
        });
        if (!team)
            throw new common_1.ForbiddenException({
                code: "OUTSIDE_MANAGER_SCOPE",
                message: "Employee is outside the manager team scope",
            });
    }
    async managedTeamIds(db, user, domain) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        if (tenant.permissions.includes(`${domain}:view-organization`) ||
            tenant.permissions.includes(`${domain}:approve-organization`))
            return null;
        const teams = await db.team.findMany({
            where: {
                organizationId: tenant.organizationId,
                managerId: user.userId,
                isActive: true,
            },
            select: { id: true },
        });
        return teams.map((x) => x.id);
    }
    async list(kind, query, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user), page = query.page ?? 1, limit = query.limit ?? 20;
        return this.prisma.withTenantTransaction(tenant, async (db) => {
            const teams = await this.managedTeamIds(db, user, kind === "timesheet" ? "timesheet" : "leave");
            if (teams && !teams.length)
                return {
                    data: [],
                    meta: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                        hasNext: false,
                        hasPrevious: page > 1,
                    },
                };
            if (query.teamId && teams && !teams.includes(query.teamId))
                throw new common_1.ForbiddenException({
                    code: "OUTSIDE_MANAGER_SCOPE",
                    message: "Requested team is outside manager scope",
                });
            const teamFilter = query.teamId
                ? query.teamId
                : teams
                    ? { in: teams }
                    : undefined;
            const date = (v) => new Date(`${v.slice(0, 10)}T00:00:00.000Z`);
            const where = {
                organizationId: tenant.organizationId,
                ...(teamFilter && { teamId: teamFilter }),
                ...(query.employeeId && { userId: query.employeeId }),
                ...(query.status && { status: query.status }),
                ...(query.type && { type: query.type }),
            };
            if (kind === "timesheet" && (query.startDate || query.endDate))
                where.workDate = {
                    ...(query.startDate && { gte: date(query.startDate) }),
                    ...(query.endDate && { lte: date(query.endDate) }),
                };
            if (kind === "leave" && (query.startDate || query.endDate)) {
                where.startDate = {
                    ...(query.endDate && { lte: date(query.endDate) }),
                };
                where.endDate = {
                    ...(query.startDate && { gte: date(query.startDate) }),
                };
            }
            const model = kind === "timesheet" ? db.timesheetEntry : db.leaveRequest;
            const [data, total] = await Promise.all([
                model.findMany({
                    where,
                    include: {
                        user: { select: { id: true, fullName: true, email: true } },
                    },
                    orderBy: kind === "timesheet"
                        ? { workDate: query.sort ?? "desc" }
                        : { startDate: query.sort ?? "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                model.count({ where }),
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
};
exports.TimesheetApprovalService = TimesheetApprovalService;
exports.TimesheetApprovalService = TimesheetApprovalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        notification_core_service_1.NotificationCoreService])
], TimesheetApprovalService);
//# sourceMappingURL=timesheet-approval.service.js.map