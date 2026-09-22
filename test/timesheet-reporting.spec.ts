import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { TimesheetReportingService } from '../src/timesheets/timesheet-reporting.service';
import { reportPeriod, workMetrics } from '../src/timesheets/timesheet-reporting.policy';
import { ReportExportService } from '../src/common/export/report-export.service';

const actor = (permissions = ['timesheet:report', 'timesheet:export', 'leave:approve']) => ({ userId: 'manager', email: 'test@example.test', role: 'MANAGER' as const,
  tenantContext: { tenantId: 'org', organizationId: 'org', userId: 'manager', membershipId: 'membership', tenantRole: 'MANAGER', permissions,
    platformAdmin: false, membershipStatus: 'active' as const, resolutionSource: 'token-session' as const } });
const query = { dateFrom: '2026-09-01', dateTo: '2026-09-22', page: 1, limit: 20 };
const group = (type: string, status: string, minutes: number, userId = 'employee', teamId = 'old') => ({ type, status, userId, teamId, teamNameSnapshot: 'Historical team', _sum: { durationMinutes: minutes } });
function fixture() {
  const db = {
    team: { findMany: jest.fn().mockResolvedValue([{ id: 'old' }]) },
    timesheetEntry: { groupBy: jest.fn().mockResolvedValue([group('REGULAR', 'APPROVED', 480), group('OVERTIME', 'APPROVED', 90), group('OVERTIME', 'SUBMITTED', 60)]), count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    leaveRequest: { groupBy: jest.fn().mockImplementation(({ by }) => Promise.resolve(by.includes('teamId') ? [{ userId: 'employee', teamId: 'old', teamNameSnapshot: 'Historical team', status: 'APPROVED', _sum: { requestedMinutes: 240 } }] : [])), count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'employee', fullName: '=HYPERLINK("bad")' }]) },
  };
  const prisma = { withTenantTransaction: jest.fn().mockImplementation((_tenant, callback) => callback(db)) };
  return { db, prisma, service: new TimesheetReportingService(prisma as any, new ReportExportService()) };
}
describe('Timesheet reporting', () => {
  it('keeps recorded, submitted and approved metrics separate', () => {
    expect(workMetrics([group('REGULAR', 'APPROVED', 480), group('OVERTIME', 'APPROVED', 60), group('OVERTIME', 'SUBMITTED', 30), group('REGULAR', 'DRAFT', 20), group('REGULAR', 'CANCELLED', 999)])).toEqual({ regularWorkedMinutes: 480, approvedOvertimeMinutes: 60, pendingOvertimeMinutes: 30, actualWorkedMinutes: 540, recordedMinutes: 590, submittedMinutes: 30 });
  });
  it.each([['2026-02-30', '2026-03-01'], ['2026-09-22', '2026-09-01'], ['2020-01-01', '2026-09-01'], ['2026-09-01T00:00:00Z', '2026-09-22']])('rejects invalid/unbounded periods %s', (from, to) => expect(() => reportPeriod(from, to)).toThrow(BadRequestException));
  it('uses DB aggregates and keeps leave out of actual work', async () => {
    const { service, db } = fixture(); const result = await service.report(query, actor());
    expect(result).toMatchObject({ totals: { actualWorkedMinutes: 570, approvedLeaveMinutes: 240, scheduledMinutes: null, attendanceVarianceMinutes: null } });
    expect(db.timesheetEntry.findMany).not.toHaveBeenCalled();
    expect(db.timesheetEntry.groupBy.mock.calls[0][0].where).toMatchObject({ organizationId: 'org', teamId: { in: ['old'] }, workDate: { gte: new Date('2026-09-01Z'), lte: new Date('2026-09-22Z') } });
  });
  it('merges transferred employee exactly once, preserving both snapshots', async () => {
    const { service, db } = fixture(); db.timesheetEntry.groupBy.mockResolvedValue([group('REGULAR', 'APPROVED', 100), group('REGULAR', 'APPROVED', 200, 'employee', 'new')]);
    const result = await service.report(query, actor()); if (!('data' in result)) throw new Error();
    expect(result.data).toHaveLength(1); expect(result.data[0].regularWorkedMinutes).toBe(300); expect(result.data[0].historicalTeams).toHaveLength(2);
  });
  it('rejects team outside managed scope before aggregation', async () => {
    const { service, db } = fixture(); await expect(service.report({ ...query, teamId: 'other' }, actor())).rejects.toThrow(ForbiddenException); expect(db.timesheetEntry.groupBy).not.toHaveBeenCalled();
  });
  it('does not treat report permission or role ADMIN as organization access', async () => {
    const { service, db } = fixture(); await service.report(query, { ...actor(), role: 'ADMIN' }); expect(db.team.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ managerId: 'manager' }) }));
  });
  it('explicit organization permission widens work but not leave', async () => {
    const { service, db } = fixture(); await service.report(query, actor(['timesheet:report', 'timesheet:view-organization']));
    expect(db.timesheetEntry.groupBy.mock.calls[0][0].where.teamId).toBeUndefined();
    expect(db.leaveRequest.groupBy.mock.calls[0][0].where.AND[0].AND).toContainEqual({ id: { in: [] } });
  });
  it('requires report/export capabilities independently', async () => {
    const { service } = fixture(); await expect(service.report(query, actor(['timesheet:export']))).rejects.toThrow(ForbiddenException);
    await expect(service.export(query, actor(['timesheet:report']))).rejects.toThrow(ForbiddenException);
  });
  it('personal identity comes from tenant and never arbitrary filters', async () => {
    const { service, db } = fixture(); await service.personal({ ...query, employeeId: 'victim', teamId: 'other' } as any, actor(['timesheet:view']));
    expect(db.timesheetEntry.groupBy.mock.calls[0][0].where).toMatchObject({ userId: 'manager', membershipId: 'membership', organizationId: 'org' });
  });
  it('fails closed without active tenant context', async () => {
    const { service, db } = fixture(); expect(() => service.report(query, { ...actor(), tenantContext: undefined } as any)).toThrow(); expect(db.timesheetEntry.groupBy).not.toHaveBeenCalled();
  });
  it('does not invent partial leave allocations', async () => {
    const { service, db } = fixture(); db.leaveRequest.groupBy.mockImplementation(({ by }) => Promise.resolve(by.includes('teamId') ? [] : [{ userId: 'employee', status: 'APPROVED', _count: { _all: 1 } }]) as any);
    expect(await service.report(query, actor())).toMatchObject({ totals: { approvedLeaveMinutes: null, pendingLeaveMinutes: 0 }, reportingMetadata: { boundaryLeaveRequests: 1 } });
  });
  it('pagination does not change overall totals', async () => {
    const { service, db } = fixture(); db.timesheetEntry.groupBy.mockResolvedValue([group('REGULAR', 'APPROVED', 100, 'a'), group('REGULAR', 'APPROVED', 200, 'b')]);
    const result = await service.report({ ...query, page: 2, limit: 1 }, actor()); if (!('data' in result)) throw new Error(); expect(result.data).toHaveLength(1); expect(result.totals.actualWorkedMinutes).toBe(300);
  });
  it('uses identical filters and calculations for export, and escapes formula injection', async () => {
    const { service, db } = fixture(); const report = await service.report(query, actor()); const file = await service.export(query, actor());
    if (!('buffer' in file) || !('totals' in report)) throw new Error();
    const workbook = XLSX.read(file.buffer); expect(workbook.SheetNames).toEqual(['Employee Summary', 'Detailed Timesheet', 'Overtime', 'Leave']);
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets['Employee Summary']);
    expect(rows[0]['Actual Work (H:MM)']).toBe('9:30'); expect(report.totals.actualWorkedMinutes).toBe(570); expect(rows[0].Employee).toMatch(/^'=/);
    expect(db.timesheetEntry.groupBy.mock.calls[0][0].where).toEqual(db.timesheetEntry.findMany.mock.calls[0][0].where);
  });
  it('enforces export limits before loading any details', async () => {
    const { service, db } = fixture(); db.timesheetEntry.count.mockResolvedValue(10001); await expect(service.export(query, actor())).rejects.toThrow(BadRequestException); expect(db.timesheetEntry.findMany).not.toHaveBeenCalled();
  });
});
