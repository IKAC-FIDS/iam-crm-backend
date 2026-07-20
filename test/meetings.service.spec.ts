import { BadRequestException } from '@nestjs/common';
import { MeetingMode, UserRole } from '@prisma/client';
import { MeetingsService } from '../src/meetings/meetings.service';

const organizationId = '00000000-0000-4000-8000-000000000001';
const user = { userId: 'user-1', email: 'a@example.com', role: UserRole.ADMIN, organizationId };
const base = { companyId: '00000000-0000-4000-8000-000000000010', title: 'Review', mode: MeetingMode.ONLINE, startAt: '2099-01-01T10:00:00.000Z', endAt: '2099-01-01T11:00:00.000Z' };

function setup() {
  const prisma = { company: { findFirst: jest.fn().mockResolvedValue({ id: base.companyId }) }, opportunity: { findFirst: jest.fn() }, user: { count: jest.fn() }, person: { count: jest.fn() }, meeting: { create: jest.fn().mockResolvedValue({ id: 'meeting-1' }) }, $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)) };
  return { prisma, service: new MeetingsService(prisma as any, { record: jest.fn() } as any) };
}

describe('MeetingsService', () => {
  it('creates an organization-scoped company meeting transactionally', async () => {
    const { prisma, service } = setup(); await service.create(base, user);
    expect(prisma.$transaction).toHaveBeenCalled(); expect(prisma.meeting.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId, companyId: base.companyId, organizerId: user.userId }) }));
  });
  it('rejects endAt before startAt', async () => { const { service } = setup(); await expect(service.create({ ...base, endAt: '2099-01-01T09:00:00.000Z' }, user)).rejects.toThrow(new BadRequestException('endAt must be after startAt')); });
  it('rejects reminderAt after startAt', async () => { const { service } = setup(); await expect(service.create({ ...base, reminderAt: '2099-01-01T10:30:00.000Z' }, user)).rejects.toThrow(new BadRequestException('reminderAt must be before startAt')); });
  it('rejects an opportunity from another company', async () => { const { prisma, service } = setup(); prisma.opportunity.findFirst.mockResolvedValue({ companyId: 'other' }); await expect(service.create({ ...base, opportunityId: '00000000-0000-4000-8000-000000000020' }, user)).rejects.toThrow('Opportunity must belong to the meeting company'); });
  it('rejects an attendee outside the company', async () => { const { prisma, service } = setup(); prisma.person.count.mockResolvedValue(0); await expect(service.create({ ...base, attendeePersonIds: ['00000000-0000-4000-8000-000000000030'] }, user)).rejects.toThrow('One or more attendees do not belong to the meeting company'); });
});
