import { WorkScheduleManagementService, validateSchedule } from '../src/timesheets/work-schedule-management';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
const dto = { effectiveFrom: '2026-09-23', days: Array.from({ length: 7 }, (_, weekday) => ({ weekday, regularMinutes: weekday === 5 ? 0 : 450 })) };
const actor = { userId: 'u', tenantContext: { tenantId: 'org', organizationId: 'org', userId: 'u', membershipId: 'm', tenantRole: 'ADMIN', permissions: ['organization:manage'], platformAdmin: false, membershipStatus: 'active', resolutionSource: 'token-session' } } as any;
describe('organization work schedule', () => {
  it('accepts explicit minutes and no invented end date', () => expect(validateSchedule(dto)).toEqual({ effectiveFrom: new Date('2026-09-23T00:00:00Z'), effectiveTo: null }));
  it('rejects impossible dates', () => expect(() => validateSchedule({ ...dto, effectiveFrom: '2026-02-30' })).toThrow(BadRequestException));
  it('rejects reversed ranges', () => expect(() => validateSchedule({ ...dto, effectiveTo: '2026-09-22' })).toThrow(BadRequestException));
  it('rejects repeated weekdays', () => expect(() => validateSchedule({ ...dto, days: Array(7).fill(dto.days[0]) })).toThrow(BadRequestException));
  it('rejects excessive or fractional minutes', () => expect(() => validateSchedule({ ...dto, days: dto.days.map(day => ({ ...day, regularMinutes: 1440.5 })) })).toThrow(BadRequestException));
  it('requires permission even for an ADMIN', () => { const service = new WorkScheduleManagementService({} as any, {} as any); expect(() => service.list({ ...actor, tenantContext: { ...actor.tenantContext, permissions: [] } })).toThrow(ForbiddenException) });
  it('scopes creation and nested days to active tenant and records audit atomically', async () => {
    const db = { workSchedule: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 's' }) } };
    const prisma = { withTenantTransaction: jest.fn().mockImplementation((_tenant, action) => action(db)) }, audit = { record: jest.fn() };
    await new WorkScheduleManagementService(prisma as any, audit as any).create(dto, actor);
    expect(db.workSchedule.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ scope: 'ORGANIZATION', organizationId: 'org', days: { create: dto.days.filter(day => day.regularMinutes > 0) } }) }));
    // Nested relation keys are supplied by Prisma, not accepted as child input.
    for (const day of db.workSchedule.create.mock.calls[0][0].data.days.create) {
      expect(day).not.toHaveProperty('organizationId');
      expect(day).not.toHaveProperty('scheduleId');
    }
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org', entityId: 's' }), db);
  });
  it.each([ [4, 5], [0, 1, 2, 3, 4, 5, 6] ])('omits zero-minute days for holidays %j', async (...holidays: number[]) => {
    const input = { ...dto, days: dto.days.map(day => ({ ...day, regularMinutes: holidays.includes(day.weekday) ? 0 : 480 })) };
    const db = { workSchedule: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 's' }) } };
    const prisma = { withTenantTransaction: jest.fn().mockImplementation((_tenant, action) => action(db)) };
    await new WorkScheduleManagementService(prisma as any, { record: jest.fn() } as any).create(input, actor);
    expect(db.workSchedule.create.mock.calls[0][0].data.days.create).toEqual(
      input.days.filter(day => !holidays.includes(day.weekday)),
    );
  });
  it('rejects overlapping programs without altering previous schedules', async () => {
    const db = { workSchedule: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }), create: jest.fn() } };
    const prisma = { withTenantTransaction: jest.fn().mockImplementation((_tenant, action) => action(db)) };
    await expect(new WorkScheduleManagementService(prisma as any, {} as any).create(dto, actor)).rejects.toThrow(ConflictException);
    expect(db.workSchedule.create).not.toHaveBeenCalled();
  });
});
