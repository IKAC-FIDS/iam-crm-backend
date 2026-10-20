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
exports.PersonalTodosService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const timezone_boundary_util_1 = require("../common/dates/timezone-boundary.util");
const api_date_util_1 = require("../common/dates/api-date.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const company_access_service_1 = require("../companies/company-access.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const find_personal_todos_dto_1 = require("./dto/find-personal-todos.dto");
const include = {
    company: { select: { id: true, legalName: true, brandName: true, logoObjectKey: true } },
    opportunity: { select: { id: true, title: true, companyId: true } },
    task: { select: { id: true, title: true, status: true } },
};
let PersonalTodosService = class PersonalTodosService {
    constructor(prisma, tasks, companyAccess) {
        this.prisma = prisma;
        this.tasks = tasks;
        this.companyAccess = companyAccess;
    }
    async findAll(query, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            const where = await this.buildWhere(tx, query, user);
            const [data, total] = await Promise.all([
                tx.personalTodo.findMany({ where, include, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
                tx.personalTodo.count({ where }),
            ]);
            const totalPages = Math.ceil(total / limit);
            return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
        });
    }
    async create(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const values = this.values(dto);
        this.validateRecurrence(values.recurrenceType, values.recurrenceInterval, values.dueAt);
        await this.validateRelations(dto, user);
        return this.prisma.withTenantTransaction(tenant, (tx) => tx.personalTodo.create({
            data: { organizationId: tenant.organizationId, userId: user.userId, ...values, companyId: dto.companyId, opportunityId: dto.opportunityId, taskId: dto.taskId },
            include,
        }));
    }
    async update(id, dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        await this.validateRelations(dto, user);
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            const current = await this.getOwned(tx, id, user);
            const dueAt = dto.dueAt === undefined ? current.dueAt : dto.dueAt ? (0, api_date_util_1.parseApiDate)(dto.dueAt, "dueAt") : null;
            const recurrenceType = dto.recurrenceType ?? current.recurrenceType;
            const recurrenceInterval = dto.recurrenceInterval ?? current.recurrenceInterval;
            this.validateRecurrence(recurrenceType, recurrenceInterval, dueAt);
            return tx.personalTodo.update({
                where: { id },
                data: {
                    ...(dto.title !== undefined && { title: this.requiredTitle(dto.title) }),
                    ...(dto.note !== undefined && { note: dto.note?.trim() || null }),
                    ...(dto.dueAt !== undefined && { dueAt }),
                    ...(dto.reminderAt !== undefined && { reminderAt: dto.reminderAt ? (0, api_date_util_1.parseApiDate)(dto.reminderAt, "reminderAt") : null, reminderSentAt: null }),
                    ...(dto.recurrenceType !== undefined && { recurrenceType }),
                    ...(dto.recurrenceInterval !== undefined && { recurrenceInterval }),
                    ...(dto.companyId !== undefined && { companyId: dto.companyId }),
                    ...(dto.opportunityId !== undefined && { opportunityId: dto.opportunityId }),
                    ...(dto.taskId !== undefined && { taskId: dto.taskId }),
                },
                include,
            });
        });
    }
    async complete(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            const current = await this.getOwned(tx, id, user);
            if (current.status === client_1.PersonalTodoStatus.DONE)
                return { todo: await tx.personalTodo.findUniqueOrThrow({ where: { id }, include }), nextOccurrence: current.nextOccurrence ?? null };
            if (current.status === client_1.PersonalTodoStatus.CANCELLED)
                throw new common_1.ConflictException({ code: "PERSONAL_TODO_CANCELLED", message: "Cancelled todo cannot be completed" });
            const claimed = await tx.personalTodo.updateMany({ where: { id, organizationId: tenant.organizationId, userId: user.userId, status: client_1.PersonalTodoStatus.TODO }, data: { status: client_1.PersonalTodoStatus.DONE, completedAt: new Date() } });
            if (!claimed.count)
                return { todo: await tx.personalTodo.findUniqueOrThrow({ where: { id }, include }), nextOccurrence: null };
            const nextOccurrence = await this.createNextOccurrence(tx, current, tenant.organizationId, user.userId);
            return { todo: await tx.personalTodo.findUniqueOrThrow({ where: { id }, include }), nextOccurrence };
        });
    }
    async reopen(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            await this.getOwned(tx, id, user);
            return tx.personalTodo.update({ where: { id }, data: { status: client_1.PersonalTodoStatus.TODO, completedAt: null }, include });
        });
    }
    async remove(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        return this.prisma.withTenantTransaction(tenant, async (tx) => {
            await this.getOwned(tx, id, user);
            return tx.personalTodo.delete({ where: { id } });
        });
    }
    async convertToTask(id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const todo = await this.prisma.withTenantTransaction(tenant, (tx) => this.getOwned(tx, id, user));
        if (todo.taskId)
            return { todo, task: await this.tasks.findOne(todo.taskId, user), alreadyConverted: true };
        if (todo.status === client_1.PersonalTodoStatus.CANCELLED)
            throw new common_1.ConflictException({ code: "PERSONAL_TODO_CANCELLED", message: "Cancelled todo cannot be converted" });
        const task = await this.tasks.create({
            title: todo.title,
            description: todo.note ?? undefined,
            dueAt: todo.dueAt?.toISOString(),
            companyId: todo.companyId ?? undefined,
            opportunityId: todo.opportunityId ?? undefined,
            assignmentScope: client_1.TaskAssignmentScope.SELF,
            assignedToId: user.userId,
        }, user);
        const updated = await this.prisma.withTenantTransaction(tenant, (tx) => tx.personalTodo.update({ where: { id }, data: { taskId: task.id, status: client_1.PersonalTodoStatus.DONE, completedAt: new Date() }, include }));
        return { todo: updated, task, alreadyConverted: false };
    }
    async buildWhere(tx, query, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const and = [{ organizationId: tenant.organizationId, userId: user.userId }];
        if (query.status)
            and.push({ status: query.status });
        if (query.companyId)
            and.push({ companyId: query.companyId });
        if (query.opportunityId)
            and.push({ opportunityId: query.opportunityId });
        if (query.dateState) {
            const organization = await tx.organization.findUnique({ where: { id: tenant.organizationId }, select: { timezone: true } });
            const { start, end } = (0, timezone_boundary_util_1.organizationDayBounds)(new Date(), organization?.timezone || "Asia/Tehran");
            if (query.dateState === find_personal_todos_dto_1.PersonalTodoDateState.TODAY)
                and.push({ status: client_1.PersonalTodoStatus.TODO, dueAt: { gte: start, lt: end } });
            if (query.dateState === find_personal_todos_dto_1.PersonalTodoDateState.UPCOMING)
                and.push({ status: client_1.PersonalTodoStatus.TODO, dueAt: { gte: end } });
            if (query.dateState === find_personal_todos_dto_1.PersonalTodoDateState.OVERDUE)
                and.push({ status: client_1.PersonalTodoStatus.TODO, dueAt: { lt: start } });
            if (query.dateState === find_personal_todos_dto_1.PersonalTodoDateState.COMPLETED)
                and.push({ status: client_1.PersonalTodoStatus.DONE });
        }
        return { AND: and };
    }
    values(dto) {
        return {
            title: this.requiredTitle(dto.title),
            note: dto.note?.trim() || undefined,
            dueAt: dto.dueAt ? (0, api_date_util_1.parseApiDate)(dto.dueAt, "dueAt") : undefined,
            reminderAt: dto.reminderAt ? (0, api_date_util_1.parseApiDate)(dto.reminderAt, "reminderAt") : undefined,
            recurrenceType: dto.recurrenceType ?? client_1.PersonalTodoRecurrenceType.NONE,
            recurrenceInterval: dto.recurrenceInterval ?? 1,
        };
    }
    async validateRelations(dto, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        if (dto.companyId)
            await this.companyAccess.assertCompanyReadable(dto.companyId, user);
        if (dto.opportunityId) {
            const opportunityId = dto.opportunityId;
            const opportunity = await this.prisma.withTenantTransaction(tenant, (tx) => tx.opportunity.findFirst({ where: { id: opportunityId, organizationId: tenant.organizationId, archivedAt: null }, select: { id: true, companyId: true } }));
            if (!opportunity)
                throw new common_1.NotFoundException({ code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" });
            await this.companyAccess.assertCompanyReadable(opportunity.companyId, user);
            if (dto.companyId && dto.companyId !== opportunity.companyId)
                throw new common_1.BadRequestException({ code: "PERSONAL_TODO_RELATION_MISMATCH", message: "Opportunity does not belong to company" });
        }
        if (dto.taskId)
            await this.tasks.assertReadable(dto.taskId, user);
    }
    async getOwned(tx, id, user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        const todo = await tx.personalTodo.findFirst({ where: { id, organizationId: tenant.organizationId, userId: user.userId }, include: { ...include, nextOccurrence: { select: { id: true, dueAt: true, status: true } } } });
        if (!todo)
            throw new common_1.NotFoundException({ code: "PERSONAL_TODO_NOT_FOUND", message: "Personal todo not found" });
        return todo;
    }
    async createNextOccurrence(tx, current, organizationId, userId) {
        if (current.nextOccurrence || current.recurrenceType === client_1.PersonalTodoRecurrenceType.NONE || !current.dueAt)
            return current.nextOccurrence ?? null;
        const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { timezone: true } });
        const timeZone = organization?.timezone || "Asia/Tehran";
        const nextDueAt = this.nextDate(current.dueAt, current.recurrenceType, current.recurrenceInterval, timeZone);
        const nextReminderAt = current.reminderAt ? this.nextDate(current.reminderAt, current.recurrenceType, current.recurrenceInterval, timeZone) : null;
        return tx.personalTodo.create({ data: { organizationId, userId, title: current.title, note: current.note, dueAt: nextDueAt, reminderAt: nextReminderAt, recurrenceType: current.recurrenceType, recurrenceInterval: current.recurrenceInterval, companyId: current.companyId, opportunityId: current.opportunityId, previousOccurrenceId: current.id }, include });
    }
    nextDate(date, type, interval, timeZone) {
        const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
        const get = (key) => Number(parts.find((part) => part.type === key)?.value);
        let year = get("year"), month = get("month"), day = get("day");
        const days = type === client_1.PersonalTodoRecurrenceType.WEEKLY ? 7 * interval : type === client_1.PersonalTodoRecurrenceType.MONTHLY ? 0 : interval;
        if (type === client_1.PersonalTodoRecurrenceType.MONTHLY) {
            const target = new Date(Date.UTC(year, month - 1 + interval, 1));
            year = target.getUTCFullYear();
            month = target.getUTCMonth() + 1;
            day = Math.min(day, new Date(Date.UTC(year, month, 0)).getUTCDate());
        }
        else {
            const target = new Date(Date.UTC(year, month - 1, day + days));
            year = target.getUTCFullYear();
            month = target.getUTCMonth() + 1;
            day = target.getUTCDate();
        }
        const wanted = Date.UTC(year, month - 1, day, get("hour"), get("minute"), get("second"));
        let result = new Date(wanted);
        for (let index = 0; index < 3; index += 1) {
            const representedParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(result);
            const value = (key) => Number(representedParts.find((part) => part.type === key)?.value);
            const represented = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
            result = new Date(result.getTime() + wanted - represented);
        }
        return result;
    }
    validateRecurrence(type, interval, dueAt) {
        if (type !== client_1.PersonalTodoRecurrenceType.NONE && !dueAt)
            throw new common_1.BadRequestException({ code: "PERSONAL_TODO_RECURRENCE_DUE_AT_REQUIRED", message: "Recurring todo requires dueAt" });
        if (type !== client_1.PersonalTodoRecurrenceType.CUSTOM && interval !== 1)
            throw new common_1.BadRequestException({ code: "PERSONAL_TODO_RECURRENCE_INTERVAL_INVALID", message: "Interval is only configurable for custom recurrence" });
    }
    requiredTitle(value) {
        const title = value.trim();
        if (!title)
            throw new common_1.BadRequestException({ code: "PERSONAL_TODO_TITLE_REQUIRED", message: "Title is required" });
        return title;
    }
};
exports.PersonalTodosService = PersonalTodosService;
exports.PersonalTodosService = PersonalTodosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tasks_service_1.TasksService,
        company_access_service_1.CompanyAccessService])
], PersonalTodosService);
//# sourceMappingURL=personal-todos.service.js.map