import { BadRequestException } from '@nestjs/common';
import { TimesheetTimeCalculationService } from '../src/timesheets/timesheet-time-calculation.service';

describe('TimesheetTimeCalculationService', () => {
  const service = new TimesheetTimeCalculationService();
  it('deducts breaks from a same-day interval', () => expect(service.calculate({ workDate: '2026-09-22', timezone: 'Asia/Tehran', startMinute: 540, endMinute: 1020, breakMinutes: 60 }).durationMinutes).toBe(420));
  it('calculates overnight work on actual instants', () => expect(service.calculate({ workDate: '2026-09-22', timezone: 'Asia/Tehran', startMinute: 1320, endMinute: 120, spansMidnight: true, breakMinutes: 30 }).durationMinutes).toBe(210));
  it('accepts duration-only entries as net minutes', () => expect(service.calculate({ workDate: '2026-09-22', timezone: 'Asia/Tehran', durationMinutes: 75, breakMinutes: 10 })).toMatchObject({ durationMinutes: 75, startMinute: null, endMinute: null }));
  it('rejects nonexistent DST local time', () => expect(() => service.resolveLocal('2026-03-08', 150, 'America/New_York')).toThrow(BadRequestException));
  it('rejects ambiguous DST local time', () => expect(() => service.resolveLocal('2026-11-01', 90, 'America/New_York')).toThrow(BadRequestException));
});
