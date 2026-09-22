import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationPath = join(
  process.cwd(),
  'prisma/migrations/20260922120000_technical_timesheet_leave_foundation/migration.sql',
);

describe('technical timesheet and leave database foundation', () => {
  const sql = readFileSync(migrationPath, 'utf8');
  const schema = readFileSync(
    join(process.cwd(), 'prisma/schema.prisma'),
    'utf8',
  );

  it('adds the domain models without reusing CRM activities', () => {
    const timesheetModel = schema.match(
      /model TimesheetEntry \{[\s\S]*?\n\}/,
    )?.[0];
    expect(schema).toContain('model TimesheetEntry');
    expect(schema).toContain('model LeaveRequest');
    expect(schema).toContain('model WorkSchedule');
    expect(schema).toContain('model WorkScheduleDay');
    expect(schema).toContain('model TimesheetApprovalHistory');
    expect(schema).toContain('enum TimeEntryType');
    expect(schema).toContain('REGULAR');
    expect(schema).toContain('OVERTIME');
    expect(timesheetModel).toBeDefined();
    expect(timesheetModel).not.toContain('activityId');
  });

  it('uses date and integer-minute persistence with explicit overnight semantics', () => {
    expect(sql).toContain('"workDate" DATE NOT NULL');
    expect(sql).toContain('"startMinute" INTEGER');
    expect(sql).toContain('"endMinute" INTEGER');
    expect(sql).toContain('"spansMidnight" BOOLEAN NOT NULL DEFAULT false');
    expect(sql).toContain('"durationMinutes" INTEGER NOT NULL');
    expect(sql).toContain('timesheet_entries_local_time_check');
  });

  it('enforces tenant-consistent employee, team, task and company references', () => {
    expect(sql).toContain('timesheet_entries_membership_tenant_fkey');
    expect(sql).toContain('timesheet_entries_team_tenant_fkey');
    expect(sql).toContain('timesheet_entries_task_tenant_fkey');
    expect(sql).toContain('timesheet_entries_company_tenant_fkey');
    expect(sql).toContain(
      'REFERENCES "organization_memberships"("id", "organizationId", "userId")',
    );
  });

  it('prevents same-level schedule overlap and defines user-team-organization scope', () => {
    expect(sql).toContain('work_schedules_scope_check');
    expect(sql).toContain('work_schedules_user_no_overlap');
    expect(sql).toContain('work_schedules_team_no_overlap');
    expect(sql).toContain('work_schedules_organization_no_overlap');
    expect(sql).toContain('EXCLUDE USING gist');
  });

  it('enables fail-closed forced RLS on every new table', () => {
    for (const table of [
      'timesheet_entries',
      'leave_requests',
      'work_schedules',
      'work_schedule_days',
      'timesheet_approval_histories',
    ]) {
      expect(sql).toContain(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain(
      "NULLIF(current_setting('app.current_organization_id', true), '')",
    );
    expect(sql).not.toContain('SECURITY DEFINER');
  });

  it('is additive and contains no destructive data operations', () => {
    expect(sql).not.toMatch(/\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
    expect(sql).not.toMatch(/\bTRUNCATE\b/i);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(sql).not.toMatch(/\bUPDATE\s+[^\n]+\s+SET\b/i);
  });
});
