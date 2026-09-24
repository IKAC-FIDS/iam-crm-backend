import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompaniesService } from '../companies/companies.service';
import { MeetingsService } from '../meetings/meetings.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { TasksService } from '../tasks/tasks.service';
import { PeopleService } from '../people/people.service';
import { ActivitiesService } from '../activities/activities.service';
import { TimesheetService } from '../timesheets/timesheet.service';
import { LeaveRequestService } from '../timesheets/leave-request.service';
import { ReportsService } from '../reports/reports.service';
import { AdvancedReportsService } from '../reports/advanced-reports.service';

type JsonSchema = Record<string, unknown>;

export interface CrmAssistantToolDefinition {
  name: string;
  description: string;
  permission: string;
  inputSchema: JsonSchema;
}

const listSchema = (searchDescription: string): JsonSchema => ({
  type: 'object',
  properties: {
    search: { type: ['string', 'null'], description: searchDescription },
    limit: { type: ['integer', 'null'], minimum: 1, maximum: 20, description: 'حداکثر تعداد نتیجه؛ حداکثر ۲۰' },
  },
  required: ['search', 'limit'],
  additionalProperties: false,
});

@Injectable()
export class CrmAssistantToolsService {
  readonly definitions: readonly CrmAssistantToolDefinition[] = [
    {
      name: 'search_companies',
      description: 'جست‌وجوی شرکت‌های قابل مشاهده برای کاربر جاری در سازمان فعال.',
      permission: 'company:view',
      inputSchema: listSchema('نام، برند، شناسه یا شماره تماس شرکت؛ برای فهرست اخیر null'),
    },
    {
      name: 'search_opportunities',
      description: 'جست‌وجوی فرصت‌های فروش قابل مشاهده همراه با مرحله، شرکت، مالک و ارزش.',
      permission: 'opportunity:view',
      inputSchema: listSchema('عنوان یا شرکت فرصت؛ برای فهرست اخیر null'),
    },
    {
      name: 'search_tasks',
      description: 'جست‌وجوی کارهای قابل مشاهده همراه با وضعیت، اولویت، سررسید و مسئول.',
      permission: 'task:view',
      inputSchema: listSchema('عنوان یا توضیحات کار؛ برای فهرست جاری null'),
    },
    {
      name: 'search_meetings',
      description: 'جست‌وجوی جلسات قابل مشاهده همراه با زمان، وضعیت، شرکت و برگزارکننده.',
      permission: 'meeting:view',
      inputSchema: listSchema('عنوان جلسه؛ برای فهرست اخیر null'),
    },
    {
      name: 'search_people', description: 'جست‌وجوی مخاطبان قابل مشاهده در دفترچه سازمان.',
      permission: 'people:directory:view', inputSchema: listSchema('نام، عنوان یا مشخصات مخاطب؛ برای فهرست اخیر null'),
    },
    {
      name: 'search_activities', description: 'جست‌وجوی فعالیت‌های قابل مشاهده و اقدامات بعدی.',
      permission: 'activity:view', inputSchema: listSchema('نوع، یادداشت یا نتیجه فعالیت؛ برای فهرست اخیر null'),
    },
    {
      name: 'list_my_timesheets', description: 'نمایش آخرین کارکردهای شخصی کاربر جاری؛ هویت کاربر از نشست گرفته می‌شود.',
      permission: 'timesheet:view', inputSchema: listSchema('برای این ابزار search نادیده گرفته می‌شود'),
    },
    {
      name: 'list_my_leave_requests', description: 'نمایش آخرین درخواست‌های مرخصی شخصی کاربر جاری.',
      permission: 'leave:view', inputSchema: listSchema('برای این ابزار search نادیده گرفته می‌شود'),
    },
    {
      name: 'search_report_users', description: 'یافتن کارشناس یا کاربر سازمانی مجاز برای گزارش عملکرد و دریافت شناسه واقعی او.',
      permission: 'report:view', inputSchema: listSchema('نام، ایمیل یا نام تیم کارشناس'),
    },
    {
      name: 'get_sales_rep_performance',
      description: 'گزارش تجمیعی و عددی عملکرد یک کارشناس شامل فرصت‌ها، نرخ تبدیل، فعالیت‌ها، جلسات و کارهای او. ابتدا شناسه را با search_report_users پیدا کن.',
      permission: 'report:view',
      inputSchema: {
        type: 'object', additionalProperties: false,
        properties: {
          userId: { type: ['string', 'null'], description: 'شناسه UUID کارشناس، اگر قبلاً مشخص شده است' },
          userName: { type: ['string', 'null'], description: 'نام یا بخشی از نام کارشناس؛ فقط میان کاربران مجاز جست‌وجو می‌شود' },
          startDate: { type: ['string', 'null'], description: 'تاریخ شروع YYYY-MM-DD؛ در صورت null سی روز اخیر' },
          endDate: { type: ['string', 'null'], description: 'تاریخ پایان YYYY-MM-DD؛ در صورت null امروز' },
        },
        required: ['userId', 'userName', 'startDate', 'endDate'],
      },
    },
  ];

  constructor(
    private readonly companies: CompaniesService,
    private readonly opportunities: OpportunitiesService,
    private readonly tasks: TasksService,
    private readonly meetings: MeetingsService,
    private readonly people: PeopleService,
    private readonly activities: ActivitiesService,
    private readonly timesheets: TimesheetService,
    private readonly leaveRequests: LeaveRequestService,
    private readonly reports: ReportsService,
    private readonly advancedReports: AdvancedReportsService,
  ) {}

  listFor(user: CurrentUserPayload) {
    return this.definitions.filter((tool) => this.hasPermission(user, tool.permission));
  }

  async call(name: string, rawArguments: unknown, user: CurrentUserPayload) {
    const definition = this.definitions.find((tool) => tool.name === name);
    if (!definition || !this.hasPermission(user, definition.permission)) {
      throw new ForbiddenException('این ابزار برای کاربر جاری قابل دسترس نیست');
    }

    if (name === 'search_report_users') return this.searchReportUsers(rawArguments, user);
    if (name === 'get_sales_rep_performance') return this.salesRepPerformance(rawArguments, user);

    const args = this.normalizeArguments(rawArguments);
    const query = { page: 1, limit: args.limit, ...(args.search ? { search: args.search } : {}) };

    switch (name) {
      case 'search_companies': {
        const result = await this.companies.findAll(user, query, { search: args.search });
        return this.compactPage(result, (item) => ({
          id: item.id,
          name: item.brandName || item.legalName,
          legalName: item.legalName,
          status: item.status,
          priority: item.priority,
          industry: item.industryOption?.name ?? item.industry,
          owner: item.owner?.fullName ?? null,
          updatedAt: item.updatedAt,
        }));
      }
      case 'search_opportunities': {
        const result = await this.opportunities.findAll(query, user);
        return this.compactPage(result, (item) => ({
          id: item.id,
          title: item.title,
          company: item.company?.brandName || item.company?.legalName,
          stage: item.stage?.label ?? null,
          priority: item.priority,
          estimatedValue: item.estimatedValue,
          expectedCloseDate: item.expectedCloseDate,
          owner: item.owner?.fullName ?? null,
          updatedAt: item.updatedAt,
        }));
      }
      case 'search_tasks': {
        const result = await this.tasks.findAll(query, user);
        return this.compactPage(result, (item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          priority: item.priority,
          dueAt: item.dueAt,
          company: item.company?.brandName || item.company?.legalName || null,
          opportunity: item.opportunity?.title ?? null,
          assignee: item.assignedTo?.fullName ?? null,
          updatedAt: item.updatedAt,
        }));
      }
      case 'search_meetings': {
        const result = await this.meetings.findAll(query, user);
        return this.compactPage(result, (item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          mode: item.mode,
          startAt: item.startAt,
          endAt: item.endAt,
          company: item.company?.brandName || item.company?.legalName || null,
          organizer: item.organizer?.fullName ?? null,
        }));
      }
      case 'search_people': {
        const result = await this.people.findDirectory(query, user);
        return this.compactPage(result, (item) => ({
          id: item.id, name: item.fullName, title: item.jobTitle ?? item.title ?? null,
          company: item.company?.brandName || item.company?.legalName || null,
          email: item.email ?? null, phone: item.phone ?? null,
        }));
      }
      case 'search_activities': {
        const result = await this.activities.findAll(query, user);
        return this.compactPage(result, (item) => ({
          id: item.id, type: item.type, notes: item.notes ?? null, outcome: item.outcome ?? null,
          occurredAt: item.occurredAt, nextActionDate: item.nextActionDate ?? null,
          company: item.company?.brandName || item.company?.legalName || null,
        }));
      }
      case 'list_my_timesheets': {
        const result = await this.timesheets.findMine({ page: 1, limit: args.limit }, user);
        return this.compactPage(result, (item) => ({
          id: item.id, workDate: item.workDate, type: item.type, status: item.status,
          durationMinutes: item.durationMinutes, description: item.description ?? null,
        }));
      }
      case 'list_my_leave_requests': {
        const result = await this.leaveRequests.findMine({ page: 1, limit: args.limit }, user);
        return this.compactPage(result, (item) => ({
          id: item.id, type: item.type, unit: item.unit, status: item.status,
          startDate: item.startDate, endDate: item.endDate, requestedMinutes: item.requestedMinutes,
        }));
      }
      default:
        throw new ForbiddenException('ابزار ناشناخته است');
    }
  }

  private hasPermission(user: CurrentUserPayload, permission: string) {
    const permissions = user.tenantContext?.permissions;
    if (permissions) return permissions.includes(permission);
    return user.role === 'ADMIN' || user.role === 'BOARDS';
  }

  private normalizeArguments(value: unknown) {
    const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const search = typeof input.search === 'string' ? input.search.trim().slice(0, 200) : undefined;
    const requestedLimit = typeof input.limit === 'number' ? Math.trunc(input.limit) : 10;
    return { search: search || undefined, limit: Math.min(20, Math.max(1, requestedLimit)) };
  }

  private async searchReportUsers(value: unknown, user: CurrentUserPayload) {
    const args = this.normalizeArguments(value);
    const options = await this.reports.getFilterOptions(user);
    const needle = args.search?.toLocaleLowerCase('fa');
    const users = options.users.filter((item) => !needle || [item.fullName, item.teamName, item.teamCode]
      .filter(Boolean).some((part) => String(part).toLocaleLowerCase('fa').includes(needle)));
    return { data: users.slice(0, args.limit).map((item) => ({ id: item.id, fullName: item.fullName, teamId: item.teamId, teamName: item.teamName, role: item.role })), meta: { total: users.length, limit: args.limit } };
  }

  private async salesRepPerformance(value: unknown, user: CurrentUserPayload) {
    const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const requestedId = typeof input.userId === 'string' ? input.userId.trim() : '';
    const requestedName = typeof input.userName === 'string' ? input.userName.trim() : '';
    const options = await this.reports.getFilterOptions(user);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let candidates = requestedId && uuid.test(requestedId) ? options.users.filter((item) => item.id === requestedId) : [];
    if (!candidates.length && requestedName) {
      const needle = this.normalizePersonName(requestedName);
      const exact = options.users.filter((item) => this.normalizePersonName(item.fullName) === needle);
      candidates = exact.length ? exact : options.users.filter((item) => this.normalizePersonName(item.fullName).includes(needle));
    }
    if (candidates.length !== 1) {
      return {
        needsSelection: true,
        message: candidates.length ? 'چند کارشناس با این نام پیدا شد؛ یکی باید انتخاب شود.' : 'کارشناس موردنظر در محدوده مجاز پیدا نشد.',
        candidates: candidates.slice(0, 10).map((item) => ({ id: item.id, fullName: item.fullName, teamName: item.teamName, role: item.role })),
      };
    }
    const userId = candidates[0].id;
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 30 * 86_400_000);
    const startDate = this.reportDate(input.startDate, defaultStart);
    const endDate = this.reportDate(input.endDate, today);
    if (new Date(startDate) > new Date(endDate)) throw new BadRequestException('تاریخ شروع گزارش بعد از تاریخ پایان است');
    if (new Date(endDate).getTime() - new Date(startDate).getTime() > 366 * 86_400_000) {
      throw new BadRequestException('بازه گزارش عملکرد نمی‌تواند بیشتر از ۳۶۶ روز باشد');
    }
    const filters = { userIds: [userId], ownerIds: [userId], startDate, endDate, page: 1, limit: 20 };
    const [performance, tasks, meetings, pipeline] = await Promise.all([
      this.reports.getUserPerformance(filters, user),
      this.advancedReports.taskPerformance(filters, user),
      this.advancedReports.meetingPerformance(filters, user),
      this.reports.getPipelineByOwner(filters, user),
    ]);
    const member = performance.members.find((item) => item.user.id === userId);
    if (!member) throw new BadRequestException('کارشناس موردنظر در محدوده گزارش قابل دسترس نیست');
    return {
      period: performance.period,
      employee: member.user,
      sales: { companiesCreated: member.companiesCreated, opportunities: member.opportunities, pipeline: pipeline.find((item) => item.ownerId === userId) ?? null },
      activity: member.activity,
      meetings: { createdCount: member.meetings, performance: meetings.summary, employee: meetings.byOrganizer.find((item) => item.organizerId === userId) ?? null },
      tasks: { createdCount: member.tasksCreated, assigned: member.tasksAssigned, performance: tasks.periodFlow, current: tasks.current, employee: tasks.byAssignee.find((item) => item.userId === userId) ?? null },
      financialVisible: performance.financialVisible,
      definitions: {
        opportunityBasis: 'فرصت‌های ایجادشده توسط کارشناس در بازه بر اساس audit.createdAt',
        activityBasis: 'فعالیت بر اساس occurredAt', meetingBasis: 'جلسه بر اساس startAt', taskBasis: 'کار بر اساس createdAt/completedAt',
      },
    };
  }

  private normalizePersonName(value: string) {
    return value
      .normalize('NFKC')
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase('fa');
  }

  private reportDate(value: unknown, fallback: Date) {
    if (value == null || value === '') return fallback.toISOString().slice(0, 10);
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
      throw new BadRequestException('تاریخ گزارش باید به شکل YYYY-MM-DD باشد');
    }
    return value;
  }

  private compactPage<T extends Record<string, any>, R>(
    result: { data: T[]; meta?: unknown },
    mapper: (item: T) => R,
  ) {
    return { data: result.data.map(mapper), meta: result.meta };
  }
}
