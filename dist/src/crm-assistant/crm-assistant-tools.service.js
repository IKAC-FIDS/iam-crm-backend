"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmAssistantToolsService = void 0;
const common_1 = require("@nestjs/common");
const companies_service_1 = require("../companies/companies.service");
const meetings_service_1 = require("../meetings/meetings.service");
const opportunities_service_1 = require("../opportunities/opportunities.service");
const tasks_service_1 = require("../tasks/tasks.service");
const people_service_1 = require("../people/people.service");
const activities_service_1 = require("../activities/activities.service");
const timesheet_service_1 = require("../timesheets/timesheet.service");
const leave_request_service_1 = require("../timesheets/leave-request.service");
const listSchema = (searchDescription) => ({
    type: 'object',
    properties: {
        search: { type: ['string', 'null'], description: searchDescription },
        limit: { type: ['integer', 'null'], minimum: 1, maximum: 20, description: 'حداکثر تعداد نتیجه؛ حداکثر ۲۰' },
    },
    required: ['search', 'limit'],
    additionalProperties: false,
});
let CrmAssistantToolsService = class CrmAssistantToolsService {
    constructor(companies, opportunities, tasks, meetings, people, activities, timesheets, leaveRequests) {
        this.companies = companies;
        this.opportunities = opportunities;
        this.tasks = tasks;
        this.meetings = meetings;
        this.people = people;
        this.activities = activities;
        this.timesheets = timesheets;
        this.leaveRequests = leaveRequests;
        this.definitions = [
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
        ];
    }
    listFor(user) {
        return this.definitions.filter((tool) => this.hasPermission(user, tool.permission));
    }
    async call(name, rawArguments, user) {
        const definition = this.definitions.find((tool) => tool.name === name);
        if (!definition || !this.hasPermission(user, definition.permission)) {
            throw new common_1.ForbiddenException('این ابزار برای کاربر جاری قابل دسترس نیست');
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
                throw new common_1.ForbiddenException('ابزار ناشناخته است');
        }
    }
    hasPermission(user, permission) {
        const permissions = user.tenantContext?.permissions;
        if (permissions)
            return permissions.includes(permission);
        return user.role === 'ADMIN' || user.role === 'BOARDS';
    }
    normalizeArguments(value) {
        const input = value && typeof value === 'object' ? value : {};
        const search = typeof input.search === 'string' ? input.search.trim().slice(0, 200) : undefined;
        const requestedLimit = typeof input.limit === 'number' ? Math.trunc(input.limit) : 10;
        return { search: search || undefined, limit: Math.min(20, Math.max(1, requestedLimit)) };
    }
    compactPage(result, mapper) {
        return { data: result.data.map(mapper), meta: result.meta };
    }
};
exports.CrmAssistantToolsService = CrmAssistantToolsService;
exports.CrmAssistantToolsService = CrmAssistantToolsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService,
        opportunities_service_1.OpportunitiesService,
        tasks_service_1.TasksService,
        meetings_service_1.MeetingsService,
        people_service_1.PeopleService,
        activities_service_1.ActivitiesService,
        timesheet_service_1.TimesheetService,
        leave_request_service_1.LeaveRequestService])
], CrmAssistantToolsService);
//# sourceMappingURL=crm-assistant-tools.service.js.map