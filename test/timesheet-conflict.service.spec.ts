import { ConflictException } from '@nestjs/common';
import { LeaveStatus, LeaveUnit, TimeEntryStatus } from '@prisma/client';
import { TimesheetConflictService } from '../src/timesheets/timesheet-conflict.service';
import { TimesheetTimeCalculationService } from '../src/timesheets/timesheet-time-calculation.service';

describe('TimesheetConflictService', () => {
  const service = new TimesheetConflictService(new TimesheetTimeCalculationService());
  const client = (overrides: any = {}) => ({
    $executeRaw: jest.fn().mockResolvedValue(1),
    timesheetEntry: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) },
    leaveRequest: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  }) as any;

  it('takes deterministic PostgreSQL advisory locks for affected dates', async () => {
    const db = client();
    await service.lockDates(db, 'org', 'user', ['2026-09-23', '2026-09-22', '2026-09-22']);
    expect(db.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it('rejects overlapping regular/overtime ranges', async () => {
    const db = client({ timesheetEntry: { findMany: jest.fn().mockResolvedValue([{ id: 'existing', workDate: new Date('2026-09-22T00:00:00Z'), startMinute: 600, endMinute: 720, spansMidnight: false }]), findFirst: jest.fn() } });
    await expect(service.assertWorkAllowed(db, { organizationId: 'org', userId: 'user', workDate: '2026-09-22', startMinute: 660, endMinute: 780, spansMidnight: false }, 'Asia/Tehran')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects duration-only work on pending leave without inventing a time interval', async () => {
    const db = client({ leaveRequest: { findMany: jest.fn().mockResolvedValue([{ id: 'leave', status: LeaveStatus.PENDING, unit: LeaveUnit.FULL_DAY }]) } });
    await expect(service.assertWorkAllowed(db, { organizationId: 'org', userId: 'user', workDate: '2026-09-22', startMinute: null, endMinute: null, spansMidnight: false }, 'Asia/Tehran')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'WORK_LEAVE_CONFLICT' }) });
  });

  it('rejects leave that intersects existing worked time', async () => {
    const db = client({ timesheetEntry: { findMany: jest.fn().mockResolvedValue([{ id: 'work', status: TimeEntryStatus.SUBMITTED, workDate: new Date('2026-09-22T00:00:00Z'), startMinute: 540, endMinute: 600, spansMidnight: false }]) } });
    await expect(service.assertLeaveAllowed(db, { organizationId: 'org', userId: 'user', unit: LeaveUnit.HOURLY, startDate: '2026-09-22', endDate: '2026-09-22', startMinute: 570, endMinute: 630 }, 'Asia/Tehran')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'LEAVE_WORK_CONFLICT' }) });
  });
  it('checks all hourly leaves when the first leave does not overlap work', async () => {
    const db = client({ leaveRequest: { findMany: jest.fn().mockResolvedValue([
      { id: 'unrelated', unit: LeaveUnit.HOURLY, startDate: new Date('2026-09-22T00:00:00Z'), startMinute: 480, endMinute: 540 },
      { id: 'conflict', unit: LeaveUnit.HOURLY, startDate: new Date('2026-09-22T00:00:00Z'), startMinute: 600, endMinute: 660 },
    ]) } });
    await expect(service.assertWorkAllowed(db, { organizationId: 'org', userId: 'user', workDate: '2026-09-22', startMinute: 615, endMinute: 645, spansMidnight: false }, 'Asia/Tehran')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'WORK_LEAVE_CONFLICT', conflictingId: 'conflict' }) });
  });

  it('checks all hourly leave requests instead of only the first candidate', async () => {
    const db = client({ leaveRequest: { findMany: jest.fn().mockResolvedValue([
      { id: 'unrelated', unit: LeaveUnit.HOURLY, startDate: new Date('2026-09-22T00:00:00Z'), startMinute: 480, endMinute: 540 },
      { id: 'conflict', unit: LeaveUnit.HOURLY, startDate: new Date('2026-09-22T00:00:00Z'), startMinute: 600, endMinute: 660 },
    ]) } });
    await expect(service.assertLeaveAllowed(db, { organizationId: 'org', userId: 'user', unit: LeaveUnit.HOURLY, startDate: '2026-09-22', endDate: '2026-09-22', startMinute: 615, endMinute: 645 }, 'Asia/Tehran')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'OVERLAPPING_LEAVE', conflictingId: 'conflict' }) });
  });

  it('checks all work entries when the first work entry does not overlap hourly leave', async () => {
    const db = client({ timesheetEntry: { findMany: jest.fn().mockResolvedValue([
      { id: 'unrelated', workDate: new Date('2026-09-22T00:00:00Z'), startMinute: 480, endMinute: 540, spansMidnight: false },
      { id: 'conflict', workDate: new Date('2026-09-22T00:00:00Z'), startMinute: 600, endMinute: 660, spansMidnight: false },
    ]) } });
    await expect(service.assertLeaveAllowed(db, { organizationId: 'org', userId: 'user', unit: LeaveUnit.HOURLY, startDate: '2026-09-22', endDate: '2026-09-22', startMinute: 615, endMinute: 645 }, 'Asia/Tehran')).rejects.toMatchObject({ response: expect.objectContaining({ code: 'LEAVE_WORK_CONFLICT', conflictingId: 'conflict' }) });
  });

});
