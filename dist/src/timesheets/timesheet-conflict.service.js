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
exports.TimesheetConflictService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const timesheet_time_calculation_service_1 = require("./timesheet-time-calculation.service");
let TimesheetConflictService = class TimesheetConflictService {
    constructor(clock) {
        this.clock = clock;
    }
    async lockDates(db, organizationId, userId, dates) {
        for (const date of [...new Set(dates)].sort())
            await db.$executeRaw(client_1.Prisma.sql `SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${userId}:${date}`}, 0))`);
    }
    async assertWorkAllowed(db, candidate, timezone) {
        const dates = candidate.spansMidnight
            ? [candidate.workDate, this.addDays(candidate.workDate, 1)]
            : [candidate.workDate];
        await this.lockDates(db, candidate.organizationId, candidate.userId, dates);
        const work = await db.timesheetEntry.findMany({
            where: {
                organizationId: candidate.organizationId,
                userId: candidate.userId,
                id: candidate.id ? { not: candidate.id } : undefined,
                status: { not: client_1.TimeEntryStatus.CANCELLED },
                workDate: {
                    gte: this.date(this.addDays(candidate.workDate, -1)),
                    lte: this.date(dates.at(-1)),
                },
            },
        });
        if (candidate.startMinute != null) {
            const interval = this.workInterval(candidate, timezone);
            const overlapping = work.find((row) => row.startMinute != null &&
                this.overlaps(interval, this.workInterval({ ...row, workDate: row.workDate.toISOString().slice(0, 10) }, timezone)));
            if (overlapping)
                this.conflict("OVERLAPPING_TIMESHEET", "The work interval overlaps another timesheet entry", overlapping.id);
        }
        const leave = await db.leaveRequest.findFirst({
            where: {
                organizationId: candidate.organizationId,
                userId: candidate.userId,
                status: { in: [client_1.LeaveStatus.PENDING, client_1.LeaveStatus.APPROVED] },
                startDate: { lte: this.date(dates.at(-1)) },
                endDate: { gte: this.date(candidate.workDate) },
            },
        });
        if (leave &&
            (candidate.startMinute == null ||
                leave.unit !== client_1.LeaveUnit.HOURLY ||
                this.leaveOverlapsWork(leave, candidate, timezone)))
            this.conflict("WORK_LEAVE_CONFLICT", "Work conflicts with pending or approved leave", leave.id);
    }
    async assertLeaveAllowed(db, candidate, timezone) {
        const dates = this.days(candidate.startDate, candidate.endDate);
        await this.lockDates(db, candidate.organizationId, candidate.userId, dates);
        const other = await db.leaveRequest.findFirst({
            where: {
                organizationId: candidate.organizationId,
                userId: candidate.userId,
                id: candidate.id ? { not: candidate.id } : undefined,
                status: { in: [client_1.LeaveStatus.PENDING, client_1.LeaveStatus.APPROVED] },
                startDate: { lte: this.date(candidate.endDate) },
                endDate: { gte: this.date(candidate.startDate) },
            },
        });
        if (other &&
            (candidate.unit !== client_1.LeaveUnit.HOURLY ||
                other.unit !== client_1.LeaveUnit.HOURLY ||
                this.hourlyLeavesOverlap(candidate, other, timezone)))
            this.conflict("OVERLAPPING_LEAVE", "Leave overlaps another pending or approved request", other.id);
        const work = await db.timesheetEntry.findFirst({
            where: {
                organizationId: candidate.organizationId,
                userId: candidate.userId,
                status: { not: client_1.TimeEntryStatus.CANCELLED },
                workDate: {
                    gte: this.date(this.addDays(candidate.startDate, -1)),
                    lte: this.date(candidate.endDate),
                },
            },
        });
        if (work &&
            (candidate.unit !== client_1.LeaveUnit.HOURLY ||
                work.startMinute == null ||
                this.leaveOverlapsWork(candidate, { ...work, workDate: work.workDate.toISOString().slice(0, 10) }, timezone)))
            this.conflict("LEAVE_WORK_CONFLICT", "Leave conflicts with recorded work", work.id);
    }
    workInterval(value, timezone) {
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
    leaveOverlapsWork(leave, work, timezone) {
        if (leave.unit !== client_1.LeaveUnit.HOURLY ||
            leave.startMinute == null ||
            leave.endMinute == null ||
            work.startMinute == null)
            return true;
        const date = leave.startDate instanceof Date
            ? leave.startDate.toISOString().slice(0, 10)
            : leave.startDate;
        return this.overlaps([
            this.clock.resolveLocal(date, leave.startMinute, timezone).getTime(),
            this.clock.resolveLocal(date, leave.endMinute, timezone).getTime(),
        ], this.workInterval(work, timezone));
    }
    hourlyLeavesOverlap(a, b, timezone) {
        const ad = a.startDate instanceof Date
            ? a.startDate.toISOString().slice(0, 10)
            : a.startDate;
        const bd = b.startDate instanceof Date
            ? b.startDate.toISOString().slice(0, 10)
            : b.startDate;
        return this.overlaps([
            this.clock.resolveLocal(ad, a.startMinute, timezone).getTime(),
            this.clock.resolveLocal(ad, a.endMinute, timezone).getTime(),
        ], [
            this.clock.resolveLocal(bd, b.startMinute, timezone).getTime(),
            this.clock.resolveLocal(bd, b.endMinute, timezone).getTime(),
        ]);
    }
    overlaps(a, b) {
        return a[0] < b[1] && b[0] < a[1];
    }
    days(start, end) {
        const result = [];
        for (let d = start; d <= end; d = this.addDays(d, 1)) {
            result.push(d);
            if (result.length > 366)
                throw new common_1.ConflictException({
                    code: "DATE_RANGE_TOO_LARGE",
                    message: "Date range cannot exceed 366 days",
                });
        }
        return result;
    }
    date(value) {
        return new Date(`${value}T00:00:00.000Z`);
    }
    addDays(value, days) {
        const d = this.date(value);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    }
    conflict(code, message, conflictingId) {
        throw new common_1.ConflictException({ code, message, conflictingId });
    }
};
exports.TimesheetConflictService = TimesheetConflictService;
exports.TimesheetConflictService = TimesheetConflictService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [timesheet_time_calculation_service_1.TimesheetTimeCalculationService])
], TimesheetConflictService);
//# sourceMappingURL=timesheet-conflict.service.js.map