import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  LeaveStatus,
  TimeEntryStatus,
  TimesheetApprovalAction,
} from "@prisma/client";
import { AuditLogService } from "../audit-log/audit-log.service";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { tenantScope } from "../common/tenant/tenant-scope.util";
import { NotificationCoreService } from "../notification-core/notification-core.service";
import {
  PrismaService,
  TenantTransactionClient,
} from "../prisma/prisma.service";
import {
  FindAdminLeaveRequestsDto,
  FindAdminTimesheetsDto,
} from "./dto/timesheet.dto";
import type { NotificationEventName } from "../notification-core/notification-core.catalog";

@Injectable()
export class TimesheetApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationCoreService,
  ) {}
  listTimesheets(query: FindAdminTimesheetsDto, user: CurrentUserPayload) {
    return this.list("timesheet", query, user);
  }
  listLeave(query: FindAdminLeaveRequestsDto, user: CurrentUserPayload) {
    return this.list("leave", query, user);
  }
  filterOptions(domain: 'timesheet' | 'leave', user: CurrentUserPayload) {
    const tenant = tenantScope.require(user);
    if (!['approve', 'approve-organization', 'view-organization', ...(domain === 'timesheet' ? ['report'] : [])].some(action => tenant.permissions.includes(`${domain}:${action}`)))
      throw new ForbiddenException('Missing domain permission');
    return this.prisma.withTenantTransaction(tenant, async db => {
      const ids = await this.managedTeamIds(db, user, domain);
      const teams = await db.team.findMany({ where: { organizationId: tenant.organizationId, ...(ids ? { id: { in: ids } } : {}) }, select: { id: true, name: true }, take: 1000, orderBy: { name: 'asc' } });
      const members = await db.organizationMembership.findMany({ where: { organizationId: tenant.organizationId,
        ...(ids ? { OR: [{ teamId: { in: ids } }, ...(domain === 'timesheet' ? [{ timesheetEntries: { some: { organizationId: tenant.organizationId, teamId: { in: ids } } } }] : [])] } : {}) },
        select: { user: { select: { id: true, fullName: true } } }, take: 1000 });
      return { teams, employees: members.map(member => member.user), limited: teams.length === 1000 || members.length === 1000 };
    });
  }
  approveTimesheet(id: string, user: CurrentUserPayload) {
    return this.decideTimesheet(id, true, undefined, user);
  }
  rejectTimesheet(id: string, reason: string, user: CurrentUserPayload) {
    return this.decideTimesheet(id, false, reason, user);
  }
  approveLeave(id: string, user: CurrentUserPayload) {
    return this.decideLeave(id, true, undefined, user);
  }
  rejectLeave(id: string, reason: string, user: CurrentUserPayload) {
    return this.decideLeave(id, false, reason, user);
  }

  private async decideTimesheet(
    id: string,
    approve: boolean,
    reason: string | undefined,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user),
      target = approve ? TimeEntryStatus.APPROVED : TimeEntryStatus.REJECTED;
    const result = await this.prisma.withTenantTransaction(
      tenant,
      async (db) => {
        const row = await db.timesheetEntry.findFirst({
          where: { id, organizationId: tenant.organizationId },
        });
        if (!row) throw new NotFoundException("Timesheet entry not found");
        await this.authorize(db, row.userId, row.teamId, user, "timesheet");
        const changed = await db.timesheetEntry.updateMany({
          where: {
            id,
            organizationId: tenant.organizationId,
            status: TimeEntryStatus.SUBMITTED,
          },
          data: {
            status: target,
            reviewedByMembershipId: tenant.membershipId,
            reviewedAt: new Date(),
            rejectionReason: approve ? null : reason,
          },
        });
        if (changed.count !== 1)
          throw new ConflictException({
            code: "CONCURRENT_DECISION_CONFLICT",
            message: "Timesheet is no longer submitted",
          });
        await db.timesheetApprovalHistory.create({
          data: {
            organizationId: tenant.organizationId,
            timesheetEntryId: id,
            actorMembershipId: tenant.membershipId,
            action: approve
              ? TimesheetApprovalAction.APPROVED
              : TimesheetApprovalAction.REJECTED,
            fromStatus: TimeEntryStatus.SUBMITTED,
            toStatus: target,
            reason,
          },
        });
        const updated = await db.timesheetEntry.findUniqueOrThrow({
          where: { id },
        });
        await this.audit.record(
          {
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
          },
          db,
        );
        return updated;
      },
    );
    const event = `${result.type === "OVERTIME" ? "OVERTIME" : "TIMESHEET"}.${target}` as NotificationEventName;
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
  private async decideLeave(
    id: string,
    approve: boolean,
    reason: string | undefined,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user),
      target = approve ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
    const result = await this.prisma.withTenantTransaction(
      tenant,
      async (db) => {
        const row = await db.leaveRequest.findFirst({
          where: { id, organizationId: tenant.organizationId },
        });
        if (!row) throw new NotFoundException("Leave request not found");
        await this.authorize(db, row.userId, row.teamId, user, "leave");
        const changed = await db.leaveRequest.updateMany({
          where: {
            id,
            organizationId: tenant.organizationId,
            status: LeaveStatus.PENDING,
          },
          data: {
            status: target,
            reviewedByMembershipId: tenant.membershipId,
            reviewedAt: new Date(),
            rejectionReason: approve ? null : reason,
          },
        });
        if (changed.count !== 1)
          throw new ConflictException({
            code: "CONCURRENT_DECISION_CONFLICT",
            message: "Leave request is no longer pending",
          });
        await db.timesheetApprovalHistory.create({
          data: {
            organizationId: tenant.organizationId,
            leaveRequestId: id,
            actorMembershipId: tenant.membershipId,
            action: approve
              ? TimesheetApprovalAction.APPROVED
              : TimesheetApprovalAction.REJECTED,
            fromStatus: LeaveStatus.PENDING,
            toStatus: target,
            reason,
          },
        });
        const updated = await db.leaveRequest.findUniqueOrThrow({
          where: { id },
        });
        await this.audit.record(
          {
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
          },
          db,
        );
        return updated;
      },
    );
    const event = `LEAVE.${target}` as NotificationEventName;
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

  private async authorize(
    db: TenantTransactionClient,
    employeeUserId: string,
    teamId: string | null,
    user: CurrentUserPayload,
    domain: "timesheet" | "leave",
  ) {
    const tenant = tenantScope.require(user);
    if (employeeUserId === user.userId)
      throw new ForbiddenException({
        code: "SELF_APPROVAL_FORBIDDEN",
        message: "Self approval is not permitted",
      });
    const broad = tenant.permissions.includes(`${domain}:approve-organization`);
    if (broad) return;
    if (!tenant.permissions.includes(`${domain}:approve`))
      throw new ForbiddenException("Approval permission is required");
    if (!teamId)
      throw new ForbiddenException({
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
      throw new ForbiddenException({
        code: "OUTSIDE_MANAGER_SCOPE",
        message: "Employee is outside the manager team scope",
      });
  }
  private async managedTeamIds(
    db: TenantTransactionClient,
    user: CurrentUserPayload,
    domain: "timesheet" | "leave",
  ) {
    const tenant = tenantScope.require(user);
    if (
      tenant.permissions.includes(`${domain}:view-organization`) ||
      tenant.permissions.includes(`${domain}:approve-organization`)
    )
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
  private async list(
    kind: "timesheet" | "leave",
    query: any,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user),
      page = query.page ?? 1,
      limit = query.limit ?? 20;
    return this.prisma.withTenantTransaction(tenant, async (db) => {
      const teams = await this.managedTeamIds(
        db,
        user,
        kind === "timesheet" ? "timesheet" : "leave",
      );
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
        throw new ForbiddenException({
          code: "OUTSIDE_MANAGER_SCOPE",
          message: "Requested team is outside manager scope",
        });
      const teamFilter = query.teamId
        ? query.teamId
        : teams
          ? { in: teams }
          : undefined;
      const date = (v: string) => new Date(`${v.slice(0, 10)}T00:00:00.000Z`);
      const where: any = {
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
      const model: any =
        kind === "timesheet" ? db.timesheetEntry : db.leaveRequest;
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          include: {
            user: { select: { id: true, fullName: true, email: true } },
            reviewedByMembership: { select: { user: { select: { fullName: true } } } },
            approvalHistory: { orderBy: { createdAt: 'asc' }, take: 100, include: { actorMembership: { select: { user: { select: { fullName: true } } } } } },
            ...(kind === 'timesheet' ? { task: { select: { id: true, title: true } }, company: { select: { id: true, legalName: true } } } : {}),
          },
          orderBy:
            kind === "timesheet"
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
}
