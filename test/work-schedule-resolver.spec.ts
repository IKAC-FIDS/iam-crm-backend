import { WorkScheduleScope } from '@prisma/client';
import { WorkScheduleResolverService } from '../src/timesheets/work-schedule-resolver.service';

describe('WorkScheduleResolverService', () => {
  const service = new WorkScheduleResolverService();
  const db = (schedule: any) => ({
    organizationSettings: { findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Tehran', firstDayOfWeek: 6 }) },
    organizationMembership: { findFirst: jest.fn().mockResolvedValue({ team: { id: 'team-1', code: 'TECH', name: 'Technical' } }) },
    workSchedule: { findFirst: jest.fn().mockResolvedValue(schedule) },
  }) as any;
  it('asks Prisma for USER, TEAM, ORGANIZATION precedence and returns daily minutes', async () => {
    const client = db({ id: 's-user', scope: WorkScheduleScope.USER, timezoneOverride: null, days: [{ weekday: 2, regularMinutes: 450 }] });
    const result = await service.resolve(client, { organizationId: 'org', membershipId: 'member', workDate: '2026-09-22' });
    expect(result).toMatchObject({ scheduleId: 's-user', scope: WorkScheduleScope.USER, expectedRegularMinutes: 450, isWorkingDay: true });
    expect(client.workSchedule.findFirst.mock.calls[0][0].where.AND[1].OR.map((x: any) => x.scope)).toEqual([WorkScheduleScope.USER, WorkScheduleScope.TEAM, WorkScheduleScope.ORGANIZATION]);
  });
  it('returns zero on a non-working weekday', async () => expect(await service.resolve(db({ id: 's', scope: WorkScheduleScope.ORGANIZATION, days: [] }), { organizationId: 'org', membershipId: 'member', workDate: '2026-09-22' })).toMatchObject({ isWorkingDay: false, expectedRegularMinutes: 0 }));
  it('preserves a historical team snapshot', async () => { const client = db(null); const result = await service.resolve(client, { organizationId: 'org', membershipId: 'member', workDate: '2026-09-22', historicalTeam: { id: 'old', code: 'OLD', name: 'Old team' } }); expect(result.team?.id).toBe('old'); expect(client.workSchedule.findFirst.mock.calls[0][0].where.AND[1].OR[1].teamId).toBe('old'); });
});
