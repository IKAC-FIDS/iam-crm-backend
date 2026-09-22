import { LeaveType, LeaveUnit } from '@prisma/client';
import { LeaveRequestService } from '../src/timesheets/leave-request.service';
import { TimesheetTimeCalculationService } from '../src/timesheets/timesheet-time-calculation.service';

describe('LeaveRequestService duration calculation', () => {
  const schedule = { resolve: jest.fn(async (_db, input) => ({ scheduleId: 'schedule', scope: 'ORGANIZATION', timezone: 'Asia/Tehran', workDate: input.workDate, isWorkingDay: input.workDate !== '2026-09-25', expectedRegularMinutes: input.workDate === '2026-09-25' ? 0 : 450, team: null })) };
  const service = new LeaveRequestService({} as any, schedule as any, new TimesheetTimeCalculationService(), {} as any, {} as any, {} as any);
  const prepare = (dto: any) => (service as any).prepare({}, dto, 'org', 'member');

  it('sums scheduled minutes only for full-day multiday leave', async () => expect(await prepare({ type: LeaveType.ANNUAL, unit: LeaveUnit.FULL_DAY, startDate: '2026-09-24', endDate: '2026-09-25' })).toMatchObject({ requestedMinutes: 450 }));
  it('rounds half days to the nearest integer minute', async () => expect(await prepare({ type: LeaveType.SICK, unit: LeaveUnit.HALF_DAY, startDate: '2026-09-24', endDate: '2026-09-24' })).toMatchObject({ requestedMinutes: 225 }));
  it('uses actual local elapsed minutes for hourly leave', async () => expect(await prepare({ type: LeaveType.OTHER, unit: LeaveUnit.HOURLY, startDate: '2026-09-24', endDate: '2026-09-24', startMinute: 540, endMinute: 630 })).toMatchObject({ requestedMinutes: 90 }));
});
