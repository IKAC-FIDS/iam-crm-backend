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
exports.ConversationReferenceOptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const companies_service_1 = require("../companies/companies.service");
const meetings_service_1 = require("../meetings/meetings.service");
const opportunities_service_1 = require("../opportunities/opportunities.service");
const tasks_service_1 = require("../tasks/tasks.service");
let ConversationReferenceOptionsService = class ConversationReferenceOptionsService {
    constructor(companies, opportunities, tasks, meetings) {
        this.companies = companies;
        this.opportunities = opportunities;
        this.tasks = tasks;
        this.meetings = meetings;
    }
    async find(query, user) {
        const search = query.search?.trim();
        if (query.type === client_1.ConversationMessageReferenceType.COMPANY) {
            this.requirePermission(user, 'company:view');
            const result = await this.companies.findOptions(user, { search, page: 1, limit: 20 });
            return { data: result.data.map((item) => ({ id: item.id, label: item.brandName || item.legalName })) };
        }
        if (query.type === client_1.ConversationMessageReferenceType.OPPORTUNITY) {
            this.requirePermission(user, 'opportunity:view');
            const result = await this.opportunities.findAll({ search, page: 1, limit: 20, activeOnly: 'true' }, user);
            return { data: result.data.map((item) => ({ id: item.id, label: item.title })) };
        }
        if (query.type === client_1.ConversationMessageReferenceType.TASK) {
            this.requirePermission(user, 'task:view');
            const result = await this.tasks.findAll({ search, page: 1, limit: 20 }, user);
            return { data: result.data.map((item) => ({ id: item.id, label: item.title })) };
        }
        this.requirePermission(user, 'meeting:view');
        const result = await this.meetings.findAll({ search, page: 1, limit: 20 }, user);
        return { data: result.data.map((item) => ({ id: item.id, label: item.title })) };
    }
    requirePermission(user, permission) {
        if (!user.tenantContext?.permissions.includes(permission)) {
            throw new common_1.ForbiddenException('شما اجازه جست‌وجوی این نوع مرجع را ندارید.');
        }
    }
};
exports.ConversationReferenceOptionsService = ConversationReferenceOptionsService;
exports.ConversationReferenceOptionsService = ConversationReferenceOptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService,
        opportunities_service_1.OpportunitiesService,
        tasks_service_1.TasksService,
        meetings_service_1.MeetingsService])
], ConversationReferenceOptionsService);
//# sourceMappingURL=conversation-reference-options.service.js.map