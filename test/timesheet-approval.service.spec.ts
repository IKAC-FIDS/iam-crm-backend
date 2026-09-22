import { ForbiddenException } from '@nestjs/common';
import { TimesheetApprovalService } from '../src/timesheets/timesheet-approval.service';

const actor = (permissions: string[], userId = 'manager') => ({ userId, email: 'a@test.local', role: 'MANAGER' as const, tenantContext: { tenantId: 'org', organizationId: 'org', userId, membershipId: 'manager-member', tenantRole: 'MANAGER', permissions, platformAdmin: false, membershipStatus: 'active' as const, resolutionSource: 'token-session' as const } });

describe('TimesheetApprovalService authorization', () => {
  const service = new TimesheetApprovalService({} as any, {} as any, {} as any);
  it('denies self approval even with organization-wide permission', async () => await expect((service as any).authorize({}, 'same', 'team', actor(['timesheet:approve-organization'], 'same'), 'timesheet')).rejects.toBeInstanceOf(ForbiddenException));
  it('allows only a team actually managed by the actor', async () => { const db = { team: { findFirst: jest.fn().mockResolvedValue({ id: 'team' }) } }; await expect((service as any).authorize(db, 'employee', 'team', actor(['timesheet:approve']), 'timesheet')).resolves.toBeUndefined(); expect(db.team.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ managerId: 'manager', organizationId: 'org' }) })); });
  it('denies employees outside manager scope', async () => { const db = { team: { findFirst: jest.fn().mockResolvedValue(null) } }; await expect((service as any).authorize(db, 'employee', 'other', actor(['leave:approve']), 'leave')).rejects.toBeInstanceOf(ForbiddenException); });
});
