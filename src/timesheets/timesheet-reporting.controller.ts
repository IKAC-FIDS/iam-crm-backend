import { Controller, Get, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AnyPermission, Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PersonalTimesheetReportDto, TimesheetReportDto, TimesheetOptionsDto } from './dto/timesheet-report.dto';
import { TimesheetApprovalService } from './timesheet-approval.service';
import { TimesheetReportingService } from './timesheet-reporting.service';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimesheetReportingController {
  constructor(private readonly reports: TimesheetReportingService, private readonly approvals: TimesheetApprovalService) {}
  @Get('admin/timesheets/filter-options')
  @AnyPermission('timesheet:approve', 'timesheet:approve-organization', 'timesheet:view-organization', 'timesheet:report', 'leave:approve', 'leave:approve-organization', 'leave:view-organization')
  options(@Query() query: TimesheetOptionsDto, @CurrentUser() user: CurrentUserPayload) { return this.approvals.filterOptions(query.domain, user); }
  @Get('admin/timesheets/reports') @Permissions('timesheet:report')
  report(@Query() query: TimesheetReportDto, @CurrentUser() user: CurrentUserPayload) { return this.reports.report(query, user); }
  @Get('timesheets/me/summary') @Permissions('timesheet:view')
  personal(@Query() query: PersonalTimesheetReportDto, @CurrentUser() user: CurrentUserPayload) { return this.reports.personal(query, user); }
  @Get('admin/timesheets/export') @Permissions('timesheet:export')
  async export(@Query() query: TimesheetReportDto, @CurrentUser() user: CurrentUserPayload, @Res({ passthrough: true }) response: Response) {
    const file = await this.reports.export(query, user);
    if (!('buffer' in file)) throw new Error('Invalid export result');
    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Disposition', file.contentDisposition);
    response.setHeader('Cache-Control', 'no-store');
    return new StreamableFile(file.buffer);
  }
}
