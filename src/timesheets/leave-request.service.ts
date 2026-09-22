import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  LeaveStatus,
  LeaveUnit,
  Prisma,
  TimesheetApprovalAction,
} from "@prisma/client";
import { AuditLogService } from "../audit-log/audit-log.service";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { tenantScope } from "../common/tenant/tenant-scope.util";
import { NotificationCoreService } from "../notification-core/notification-core.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateLeaveRequestDto,
  FindMyLeaveRequestsDto,
  UpdateLeaveRequestDto,
} from "./dto/timesheet.dto";
import { TimesheetConflictService } from "./timesheet-conflict.service";
import { TimesheetTimeCalculationService } from "./timesheet-time-calculation.service";
import { WorkScheduleResolverService } from "./work-schedule-resolver.service";

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedules: WorkScheduleResolverService,
    private readonly clock: TimesheetTimeCalculationService,
    private readonly conflicts: TimesheetConflictService,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationCoreService,
  ) {}
  findMine(query: FindMyLeaveRequestsDto, user: CurrentUserPayload) {
    return this.list(query, user, { userId: user.userId });
  }
  async findOne(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user),
      broad = tenant.permissions.includes("leave:view-organization");
    const row = await this.prisma.withTenantTransaction(tenant, (db) =>
      db.leaveRequest.findFirst({
        where: {
          id,
          organizationId: tenant.organizationId,
          ...(broad ? {} : { userId: user.userId }),
        },
        include: { approvalHistory: { orderBy: { createdAt: "asc" } } },
      }),
    );
    if (!row) throw new NotFoundException("Leave request not found");
    return row;
  }
  async create(dto: CreateLeaveRequestDto, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user);
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
        throw new BadRequestException({
          code: "ACTIVE_MEMBERSHIP_REQUIRED",
          message: "An active organization membership is required",
        });
      const input = await this.prepare(
        db,
        dto,
        tenant.organizationId,
        membership.id,
      );
      await this.conflicts.assertLeaveAllowed(
        db,
        {
          organizationId: tenant.organizationId,
          userId: user.userId,
          ...input,
        },
        input.timezone,
      );
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
      await this.audit.record(
        {
          actorId: user.userId,
          actorMembershipId: membership.id,
          organizationId: tenant.organizationId,
          entityType: "leave-request",
          entityId: row.id,
          action: "leave.created",
          after: row,
        },
        db,
      );
      return row;
    });
  }
  async update(
    id: string,
    dto: UpdateLeaveRequestDto,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user);
    return this.prisma.withTenantTransaction(tenant, async (db) => {
      const current = await db.leaveRequest.findFirst({
        where: {
          id,
          organizationId: tenant.organizationId,
          userId: user.userId,
        },
      });
      if (!current) throw new NotFoundException("Leave request not found");
      if (!new Set<LeaveStatus>([LeaveStatus.DRAFT, LeaveStatus.REJECTED]).has(current.status))
        throw new ConflictException({
          code: "INVALID_LEAVE_STATE",
          message: "Only draft or rejected leave may be edited",
        });
      const input = await this.prepare(
        db,
        dto,
        tenant.organizationId,
        current.membershipId,
        {
          id: current.teamId,
          code: current.teamCodeSnapshot,
          name: current.teamNameSnapshot,
        },
      );
      await this.conflicts.assertLeaveAllowed(
        db,
        {
          id,
          organizationId: tenant.organizationId,
          userId: user.userId,
          ...input,
        },
        input.timezone,
      );
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
          ...(current.status === LeaveStatus.REJECTED
            ? {
                status: LeaveStatus.DRAFT,
                rejectionReason: null,
                reviewedAt: null,
                reviewedByMembershipId: null,
              }
            : {}),
        },
      });
      await this.audit.record(
        {
          actorId: user.userId,
          actorMembershipId: tenant.membershipId,
          organizationId: tenant.organizationId,
          entityType: "leave-request",
          entityId: id,
          action: "leave.updated",
          before: current,
          after: row,
        },
        db,
      );
      return row;
    });
  }
  submit(id: string, user: CurrentUserPayload) {
    return this.transition(
      id,
      user,
      [LeaveStatus.DRAFT, LeaveStatus.REJECTED],
      LeaveStatus.PENDING,
      TimesheetApprovalAction.SUBMITTED,
    );
  }
  cancel(id: string, user: CurrentUserPayload) {
    return this.transition(
      id,
      user,
      [LeaveStatus.DRAFT, LeaveStatus.REJECTED],
      LeaveStatus.CANCELLED,
      TimesheetApprovalAction.CANCELLED,
    );
  }

  private async prepare(
    db: any,
    dto: CreateLeaveRequestDto,
    organizationId: string,
    membershipId: string,
    historicalTeam?: any,
  ) {
    const startDate = dto.startDate.slice(0, 10),
      endDate = dto.endDate.slice(0, 10);
    if (endDate < startDate)
      throw new BadRequestException({
        code: "INVALID_DATE_RANGE",
        message: "endDate must not precede startDate",
      });
    const days = this.days(startDate, endDate);
    if (days.length > 366)
      throw new BadRequestException({
        code: "DATE_RANGE_TOO_LARGE",
        message: "Leave cannot exceed 366 days",
      });
    if (
      dto.unit === LeaveUnit.HOURLY &&
      (days.length !== 1 ||
        dto.startMinute == null ||
        dto.endMinute == null ||
        dto.endMinute <= dto.startMinute)
    )
      throw new BadRequestException({
        code: "INVALID_HOURLY_LEAVE",
        message:
          "Hourly leave requires one date and a positive local time range",
      });
    if (
      dto.unit !== LeaveUnit.HOURLY &&
      (dto.startMinute != null || dto.endMinute != null)
    )
      throw new BadRequestException({
        code: "INVALID_LEAVE_TIME",
        message: "Only hourly leave accepts start/end minutes",
      });
    let requestedMinutes = 0,
      timezone = "";
    for (const date of days) {
      const schedule = await this.schedules.resolve(db, {
        organizationId,
        membershipId,
        workDate: date,
        historicalTeam,
      });
      timezone ||= schedule.timezone;
      if (!schedule.scheduleId)
        throw new BadRequestException({
          code: "MISSING_WORK_SCHEDULE",
          message: `No work schedule applies on ${date}`,
        });
      if (dto.unit === LeaveUnit.FULL_DAY)
        requestedMinutes += schedule.expectedRegularMinutes;
      else if (dto.unit === LeaveUnit.HALF_DAY)
        requestedMinutes += Math.round(schedule.expectedRegularMinutes / 2);
      else {
        if (!schedule.isWorkingDay)
          throw new BadRequestException({
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
          throw new BadRequestException({
            code: "HOURLY_LEAVE_EXCEEDS_SCHEDULE",
            message: "Hourly leave exceeds scheduled minutes",
          });
        requestedMinutes += elapsed;
      }
    }
    if (requestedMinutes <= 0)
      throw new BadRequestException({
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
  private async transition(
    id: string,
    user: CurrentUserPayload,
    from: LeaveStatus[],
    to: LeaveStatus,
    action: TimesheetApprovalAction,
  ) {
    const tenant = tenantScope.require(user);
    const result = await this.prisma.withTenantTransaction(
      tenant,
      async (db) => {
        const current = await db.leaveRequest.findFirst({
          where: {
            id,
            organizationId: tenant.organizationId,
            userId: user.userId,
          },
        });
        if (!current) throw new NotFoundException("Leave request not found");
        if (
          to === LeaveStatus.PENDING &&
          (!current.requestedMinutes || current.requestedMinutes <= 0)
        )
          throw new BadRequestException({
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
            ...(to === LeaveStatus.PENDING
              ? { submittedAt: new Date(), rejectionReason: null }
              : {}),
          },
        });
        if (changed.count !== 1)
          throw new ConflictException({
            code: "INVALID_LEAVE_STATE",
            message: `Leave cannot transition from ${current.status} to ${to}`,
          });
        const historyAction =
          current.status === LeaveStatus.REJECTED && to === LeaveStatus.PENDING
            ? TimesheetApprovalAction.RESUBMITTED
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
        await this.audit.record(
          {
            actorId: user.userId,
            actorMembershipId: tenant.membershipId,
            organizationId: tenant.organizationId,
            entityType: "leave-request",
            entityId: id,
            action: `leave.${to.toLowerCase()}`,
            before: { status: current.status },
            after: { status: to },
          },
          db,
        );
        return row;
      },
    );
    if (to === LeaveStatus.PENDING)
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
  private async list(
    query: FindMyLeaveRequestsDto,
    user: CurrentUserPayload,
    scope: Prisma.LeaveRequestWhereInput,
  ) {
    const tenant = tenantScope.require(user),
      page = query.page ?? 1,
      limit = query.limit ?? 20;
    const where: Prisma.LeaveRequestWhereInput = {
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
  private days(start: string, end: string) {
    const result: string[] = [];
    for (let d = start; d <= end; d = this.addDays(d, 1)) result.push(d);
    return result;
  }
  private addDays(value: string, count: number) {
    const d = this.date(value);
    d.setUTCDate(d.getUTCDate() + count);
    return d.toISOString().slice(0, 10);
  }
  private date(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
