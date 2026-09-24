import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompaniesService } from '../companies/companies.service';
import { MeetingsService } from '../meetings/meetings.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { TasksService } from '../tasks/tasks.service';

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
  ];

  constructor(
    private readonly companies: CompaniesService,
    private readonly opportunities: OpportunitiesService,
    private readonly tasks: TasksService,
    private readonly meetings: MeetingsService,
  ) {}

  listFor(user: CurrentUserPayload) {
    return this.definitions.filter((tool) => this.hasPermission(user, tool.permission));
  }

  async call(name: string, rawArguments: unknown, user: CurrentUserPayload) {
    const definition = this.definitions.find((tool) => tool.name === name);
    if (!definition || !this.hasPermission(user, definition.permission)) {
      throw new ForbiddenException('این ابزار برای کاربر جاری قابل دسترس نیست');
    }

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

  private compactPage<T extends Record<string, any>, R>(
    result: { data: T[]; meta?: unknown },
    mapper: (item: T) => R,
  ) {
    return { data: result.data.map(mapper), meta: result.meta };
  }
}
