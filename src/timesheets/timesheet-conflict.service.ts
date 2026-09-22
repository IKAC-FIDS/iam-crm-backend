import { ConflictException, Injectable } from "@nestjs/common";
import {
  LeaveStatus,
  LeaveUnit,
  Prisma,
  TimeEntryStatus,
} from "@prisma/client";
import { TenantTransactionClient } from "../prisma/prisma.service";
import { TimesheetTimeCalculationService } from "./timesheet-time-calculation.service";

type WorkCandidate = {
  id?: string;
  organizationId: string;
  userId: string;
  workDate: string;
  startMinute: number | null;
  endMinute: number | null;
  spansMidnight: boolean;
};
type LeaveCandidate = {
  id?: string;
  organizationId: string;
  userId: string;
  unit: LeaveUnit;
  startDate: string;
  endDate: string;
  startMinute: number | null;
  endMinute: number | null;
};

@Injectable()
export class TimesheetConflictService {
  constructor(private readonly clock: TimesheetTimeCalculationService) {}

  async lockDates(
    db: TenantTransactionClient,
    organizationId: string,
    userId: string,
    dates: string[],
  ) {
    for (const date of [...new Set(dates)].sort())
      await db.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${userId}:${date}`}, 0))`,
      );
  }

  async assertWorkAllowed(
    db: TenantTransactionClient,
    candidate: WorkCandidate,
    timezone: string,
  ) {
    const dates = candidate.spansMidnight
      ? [candidate.workDate, this.addDays(candidate.workDate, 1)]
      : [candidate.workDate];
    await this.lockDates(db, candidate.organizationId, candidate.userId, dates);
    const work = await db.timesheetEntry.findMany({
      where: {
        organizationId: candidate.organizationId,
        userId: candidate.userId,
        id: candidate.id ? { not: candidate.id } : undefined,
        status: { not: TimeEntryStatus.CANCELLED },
        workDate: {
          gte: this.date(this.addDays(candidate.workDate, -1)),
          lte: this.date(dates.at(-1)!),
        },
      },
    });
    if (candidate.startMinute != null) {
      const interval = this.workInterval(candidate, timezone);
      const overlapping = work.find(
        (row) =>
          row.startMinute != null &&
          this.overlaps(
            interval,
            this.workInterval(
              { ...row, workDate: row.workDate.toISOString().slice(0, 10) },
              timezone,
            ),
          ),
      );
      if (overlapping)
        this.conflict(
          "OVERLAPPING_TIMESHEET",
          "The work interval overlaps another timesheet entry",
          overlapping.id,
        );
    }
    const leave = await db.leaveRequest.findFirst({
      where: {
        organizationId: candidate.organizationId,
        userId: candidate.userId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: { lte: this.date(dates.at(-1)!) },
        endDate: { gte: this.date(candidate.workDate) },
      },
    });
    if (
      leave &&
      (candidate.startMinute == null ||
        leave.unit !== LeaveUnit.HOURLY ||
        this.leaveOverlapsWork(leave, candidate, timezone))
    )
      this.conflict(
        "WORK_LEAVE_CONFLICT",
        "Work conflicts with pending or approved leave",
        leave.id,
      );
  }

  async assertLeaveAllowed(
    db: TenantTransactionClient,
    candidate: LeaveCandidate,
    timezone: string,
  ) {
    const dates = this.days(candidate.startDate, candidate.endDate);
    await this.lockDates(db, candidate.organizationId, candidate.userId, dates);
    const other = await db.leaveRequest.findFirst({
      where: {
        organizationId: candidate.organizationId,
        userId: candidate.userId,
        id: candidate.id ? { not: candidate.id } : undefined,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: { lte: this.date(candidate.endDate) },
        endDate: { gte: this.date(candidate.startDate) },
      },
    });
    if (
      other &&
      (candidate.unit !== LeaveUnit.HOURLY ||
        other.unit !== LeaveUnit.HOURLY ||
        this.hourlyLeavesOverlap(candidate, other, timezone))
    )
      this.conflict(
        "OVERLAPPING_LEAVE",
        "Leave overlaps another pending or approved request",
        other.id,
      );
    const work = await db.timesheetEntry.findFirst({
      where: {
        organizationId: candidate.organizationId,
        userId: candidate.userId,
        status: { not: TimeEntryStatus.CANCELLED },
        workDate: {
          gte: this.date(this.addDays(candidate.startDate, -1)),
          lte: this.date(candidate.endDate),
        },
      },
    });
    if (
      work &&
      (candidate.unit !== LeaveUnit.HOURLY ||
        work.startMinute == null ||
        this.leaveOverlapsWork(
          candidate,
          { ...work, workDate: work.workDate.toISOString().slice(0, 10) },
          timezone,
        ))
    )
      this.conflict(
        "LEAVE_WORK_CONFLICT",
        "Leave conflicts with recorded work",
        work.id,
      );
  }

  private workInterval(value: any, timezone: string): [number, number] {
    const start = this.clock
      .resolveLocal(value.workDate, value.startMinute, timezone)
      .getTime();
    const endDate = value.spansMidnight
      ? this.addDays(value.workDate, 1)
      : value.workDate;
    return [
      start,
      this.clock.resolveLocal(endDate, value.endMinute, timezone).getTime(),
    ];
  }
  private leaveOverlapsWork(leave: any, work: any, timezone: string) {
    if (
      leave.unit !== LeaveUnit.HOURLY ||
      leave.startMinute == null ||
      leave.endMinute == null ||
      work.startMinute == null
    )
      return true;
    const date =
      leave.startDate instanceof Date
        ? leave.startDate.toISOString().slice(0, 10)
        : leave.startDate;
    return this.overlaps(
      [
        this.clock.resolveLocal(date, leave.startMinute, timezone).getTime(),
        this.clock.resolveLocal(date, leave.endMinute, timezone).getTime(),
      ],
      this.workInterval(work, timezone),
    );
  }
  private hourlyLeavesOverlap(a: any, b: any, timezone: string) {
    const ad =
      a.startDate instanceof Date
        ? a.startDate.toISOString().slice(0, 10)
        : a.startDate;
    const bd =
      b.startDate instanceof Date
        ? b.startDate.toISOString().slice(0, 10)
        : b.startDate;
    return this.overlaps(
      [
        this.clock.resolveLocal(ad, a.startMinute, timezone).getTime(),
        this.clock.resolveLocal(ad, a.endMinute, timezone).getTime(),
      ],
      [
        this.clock.resolveLocal(bd, b.startMinute, timezone).getTime(),
        this.clock.resolveLocal(bd, b.endMinute, timezone).getTime(),
      ],
    );
  }
  private overlaps(a: [number, number], b: [number, number]) {
    return a[0] < b[1] && b[0] < a[1];
  }
  private days(start: string, end: string) {
    const result: string[] = [];
    for (let d = start; d <= end; d = this.addDays(d, 1)) {
      result.push(d);
      if (result.length > 366)
        throw new ConflictException({
          code: "DATE_RANGE_TOO_LARGE",
          message: "Date range cannot exceed 366 days",
        });
    }
    return result;
  }
  private date(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  private addDays(value: string, days: number) {
    const d = this.date(value);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
  private conflict(
    code: string,
    message: string,
    conflictingId: string,
  ): never {
    throw new ConflictException({ code, message, conflictingId });
  }
}
