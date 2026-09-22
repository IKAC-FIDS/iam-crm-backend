import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  TimeEntryStatus,
  TimesheetApprovalAction,
} from "@prisma/client";
import { AuditLogService } from "../audit-log/audit-log.service";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { tenantScope } from "../common/tenant/tenant-scope.util";
import { NotificationCoreService } from "../notification-core/notification-core.service";
import { PrismaService } from "../prisma/prisma.service";
import { TasksService } from "../tasks/tasks.service";
import { CompanyAccessService } from "../companies/company-access.service";
import {
  CreateTimesheetDto,
  FindMyTimesheetsDto,
  UpdateTimesheetDto,
} from "./dto/timesheet.dto";
import { TimesheetConflictService } from "./timesheet-conflict.service";
import { TimesheetTimeCalculationService } from "./timesheet-time-calculation.service";
import { WorkScheduleResolverService } from "./work-schedule-resolver.service";
import type { NotificationEventName } from "../notification-core/notification-core.catalog";

@Injectable()
export class TimesheetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedules: WorkScheduleResolverService,
    private readonly clock: TimesheetTimeCalculationService,
    private readonly conflicts: TimesheetConflictService,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationCoreService,
    private readonly tasks: TasksService,
    private readonly companies: CompanyAccessService,
  ) {}

  findMine(query: FindMyTimesheetsDto, user: CurrentUserPayload) {
    return this.list(query, user, { userId: user.userId });
  }
  async findOne(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user),
      broad = tenant.permissions.includes("timesheet:view-organization");
    const row = await this.prisma.withTenantTransaction(tenant, (db) =>
      db.timesheetEntry.findFirst({
        where: {
          id,
          organizationId: tenant.organizationId,
          ...(broad ? {} : { userId: user.userId }),
        },
        include: { approvalHistory: { orderBy: { createdAt: "asc" } } },
      }),
    );
    if (!row) throw new NotFoundException("Timesheet entry not found");
    return row;
  }
  async create(dto: CreateTimesheetDto, user: CurrentUserPayload) {
    await this.references(dto, user);
    const tenant = tenantScope.require(user);
    return this.prisma.withTenantTransaction(tenant, async (db) => {
      const membership = await this.membership(
        db,
        tenant.membershipId,
        tenant.organizationId,
        user.userId,
      );
      const workDate = dto.workDate.slice(0, 10),
        schedule = await this.schedules.resolve(db, {
          organizationId: tenant.organizationId,
          membershipId: membership.id,
          workDate,
        });
      const time = this.clock.calculate({
        ...dto,
        workDate,
        timezone: schedule.timezone,
      });
      await this.conflicts.assertWorkAllowed(
        db,
        {
          organizationId: tenant.organizationId,
          userId: user.userId,
          workDate,
          startMinute: time.startMinute,
          endMinute: time.endMinute,
          spansMidnight: time.spansMidnight,
        },
        schedule.timezone,
      );
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
      await this.audit.record(
        {
          actorId: user.userId,
          actorMembershipId: membership.id,
          organizationId: tenant.organizationId,
          entityType: "timesheet",
          entityId: row.id,
          action: "timesheet.created",
          after: row,
        },
        db,
      );
      return row;
    });
  }
  async update(id: string, dto: UpdateTimesheetDto, user: CurrentUserPayload) {
    await this.references(dto, user);
    const tenant = tenantScope.require(user);
    return this.prisma.withTenantTransaction(tenant, async (db) => {
      const current = await db.timesheetEntry.findFirst({
        where: {
          id,
          organizationId: tenant.organizationId,
          userId: user.userId,
        },
      });
      if (!current) throw new NotFoundException("Timesheet entry not found");
      if (
        !new Set<TimeEntryStatus>([
          TimeEntryStatus.DRAFT,
          TimeEntryStatus.REJECTED,
        ]).has(current.status)
      )
        throw new ConflictException({
          code: "INVALID_TIMESHEET_STATE",
          message: "Only draft or rejected entries may be edited",
        });
      const workDate = dto.workDate.slice(0, 10),
        schedule = await this.schedules.resolve(db, {
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
      await this.conflicts.assertWorkAllowed(
        db,
        {
          id,
          organizationId: tenant.organizationId,
          userId: user.userId,
          workDate,
          startMinute: time.startMinute,
          endMinute: time.endMinute,
          spansMidnight: time.spansMidnight,
        },
        schedule.timezone,
      );
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
          ...(current.status === TimeEntryStatus.REJECTED
            ? {
                status: TimeEntryStatus.DRAFT,
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
          entityType: "timesheet",
          entityId: id,
          action: "timesheet.updated",
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
      [TimeEntryStatus.DRAFT, TimeEntryStatus.REJECTED],
      TimeEntryStatus.SUBMITTED,
      TimesheetApprovalAction.SUBMITTED,
    );
  }
  cancel(id: string, user: CurrentUserPayload) {
    return this.transition(
      id,
      user,
      [TimeEntryStatus.DRAFT, TimeEntryStatus.REJECTED],
      TimeEntryStatus.CANCELLED,
      TimesheetApprovalAction.CANCELLED,
    );
  }

  private async transition(
    id: string,
    user: CurrentUserPayload,
    from: TimeEntryStatus[],
    to: TimeEntryStatus,
    action: TimesheetApprovalAction,
  ) {
    const tenant = tenantScope.require(user);
    const result = await this.prisma.withTenantTransaction(tenant, async (db) => {
      const current = await db.timesheetEntry.findFirst({
        where: {
          id,
          organizationId: tenant.organizationId,
          userId: user.userId,
        },
      });
      if (!current) throw new NotFoundException("Timesheet entry not found");
      const updated = await db.timesheetEntry.updateMany({
        where: {
          id,
          organizationId: tenant.organizationId,
          userId: user.userId,
          status: { in: from },
        },
        data: {
          status: to,
          ...(to === TimeEntryStatus.SUBMITTED
            ? { submittedAt: new Date(), rejectionReason: null }
            : {}),
        },
      });
      if (updated.count !== 1)
        throw new ConflictException({
          code: "INVALID_TIMESHEET_STATE",
          message: `Timesheet cannot transition from ${current.status} to ${to}`,
        });
      const historyAction =
        current.status === TimeEntryStatus.REJECTED &&
        to === TimeEntryStatus.SUBMITTED
          ? TimesheetApprovalAction.RESUBMITTED
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
      await this.audit.record(
        {
          actorId: user.userId,
          actorMembershipId: tenant.membershipId,
          organizationId: tenant.organizationId,
          entityType: "timesheet",
          entityId: id,
          action: `timesheet.${to.toLowerCase()}`,
          before: { status: current.status },
          after: { status: to },
        },
        db,
      );
      return row;
    });
    const event = `${result.type === "OVERTIME" ? "OVERTIME" : "TIMESHEET"}.${to}` as NotificationEventName;
    if (to === TimeEntryStatus.SUBMITTED)
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
  private async list(
    query: FindMyTimesheetsDto,
    user: CurrentUserPayload,
    scope: Prisma.TimesheetEntryWhereInput,
  ) {
    const tenant = tenantScope.require(user),
      page = query.page ?? 1,
      limit = query.limit ?? 20;
    const where: Prisma.TimesheetEntryWhereInput = {
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
          include: { task: { select: { id: true, title: true } }, company: { select: { id: true, legalName: true } }, reviewedByMembership: { select: { user: { select: { fullName: true } } } }, approvalHistory: { orderBy: { createdAt: 'asc' }, take: 100, include: { actorMembership: { select: { user: { select: { fullName: true } } } } } } },
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
  private async references(dto: CreateTimesheetDto, user: CurrentUserPayload) {
    if (dto.taskId) await this.tasks.assertReadable(dto.taskId, user);
    if (dto.companyId)
      await this.companies.assertCompanyReadable(dto.companyId, user);
  }
  private async membership(
    db: any,
    id: string,
    organizationId: string,
    userId: string,
  ) {
    const row = await db.organizationMembership.findFirst({
      where: { id, organizationId, userId, status: "ACTIVE" },
      include: { team: { select: { id: true, code: true, name: true } } },
    });
    if (!row)
      throw new BadRequestException({
        code: "ACTIVE_MEMBERSHIP_REQUIRED",
        message: "An active organization membership is required",
      });
    return row;
  }
  private date(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
