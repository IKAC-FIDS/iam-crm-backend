import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { PersonalTodoRecurrenceType, PersonalTodoStatus, Prisma, TaskAssignmentScope } from "@prisma/client"
import { CurrentUserPayload } from "../common/decorators/current-user.decorator"
import { organizationDayBounds } from "../common/dates/timezone-boundary.util"
import { parseApiDate } from "../common/dates/api-date.util"
import { tenantScope } from "../common/tenant/tenant-scope.util"
import { CompanyAccessService } from "../companies/company-access.service"
import { PrismaService, TenantTransactionClient } from "../prisma/prisma.service"
import { TasksService } from "../tasks/tasks.service"
import { CreatePersonalTodoDto } from "./dto/create-personal-todo.dto"
import { FindPersonalTodosDto, PersonalTodoDateState } from "./dto/find-personal-todos.dto"
import { UpdatePersonalTodoDto } from "./dto/update-personal-todo.dto"

const include = {
  company: { select: { id: true, legalName: true, brandName: true, logoObjectKey: true } },
  opportunity: { select: { id: true, title: true, companyId: true } },
  task: { select: { id: true, title: true, status: true } },
} satisfies Prisma.PersonalTodoInclude

@Injectable()
export class PersonalTodosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasks: TasksService,
    private readonly companyAccess: CompanyAccessService,
  ) {}

  async findAll(query: FindPersonalTodosDto, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      const where = await this.buildWhere(tx, query, user)
      const [data, total] = await Promise.all([
        tx.personalTodo.findMany({ where, include, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
        tx.personalTodo.count({ where }),
      ])
      const totalPages = Math.ceil(total / limit)
      return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } }
    })
  }

  async create(dto: CreatePersonalTodoDto, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    const values = this.values(dto)
    this.validateRecurrence(values.recurrenceType, values.recurrenceInterval, values.dueAt)
    await this.validateRelations(dto, user)
    return this.prisma.withTenantTransaction(tenant, (tx) => tx.personalTodo.create({
      data: { organizationId: tenant.organizationId, userId: user.userId, ...values, companyId: dto.companyId, opportunityId: dto.opportunityId, taskId: dto.taskId },
      include,
    }))
  }

  async update(id: string, dto: UpdatePersonalTodoDto, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    await this.validateRelations(dto, user)
    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      const current = await this.getOwned(tx, id, user)
      const dueAt = dto.dueAt === undefined ? current.dueAt : dto.dueAt ? parseApiDate(dto.dueAt, "dueAt") : null
      const recurrenceType = dto.recurrenceType ?? current.recurrenceType
      const recurrenceInterval = dto.recurrenceInterval ?? current.recurrenceInterval
      this.validateRecurrence(recurrenceType, recurrenceInterval, dueAt)
      return tx.personalTodo.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: this.requiredTitle(dto.title) }),
          ...(dto.note !== undefined && { note: dto.note?.trim() || null }),
          ...(dto.dueAt !== undefined && { dueAt }),
          ...(dto.reminderAt !== undefined && { reminderAt: dto.reminderAt ? parseApiDate(dto.reminderAt, "reminderAt") : null, reminderSentAt: null }),
          ...(dto.recurrenceType !== undefined && { recurrenceType }),
          ...(dto.recurrenceInterval !== undefined && { recurrenceInterval }),
          ...(dto.companyId !== undefined && { companyId: dto.companyId }),
          ...(dto.opportunityId !== undefined && { opportunityId: dto.opportunityId }),
          ...(dto.taskId !== undefined && { taskId: dto.taskId }),
        },
        include,
      })
    })
  }

  async complete(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      const current = await this.getOwned(tx, id, user)
      if (current.status === PersonalTodoStatus.DONE) return { todo: await tx.personalTodo.findUniqueOrThrow({ where: { id }, include }), nextOccurrence: current.nextOccurrence ?? null }
      if (current.status === PersonalTodoStatus.CANCELLED) throw new ConflictException({ code: "PERSONAL_TODO_CANCELLED", message: "Cancelled todo cannot be completed" })
      const claimed = await tx.personalTodo.updateMany({ where: { id, organizationId: tenant.organizationId, userId: user.userId, status: PersonalTodoStatus.TODO }, data: { status: PersonalTodoStatus.DONE, completedAt: new Date() } })
      if (!claimed.count) return { todo: await tx.personalTodo.findUniqueOrThrow({ where: { id }, include }), nextOccurrence: null }
      const nextOccurrence = await this.createNextOccurrence(tx, current, tenant.organizationId, user.userId)
      return { todo: await tx.personalTodo.findUniqueOrThrow({ where: { id }, include }), nextOccurrence }
    })
  }

  async reopen(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      await this.getOwned(tx, id, user)
      return tx.personalTodo.update({ where: { id }, data: { status: PersonalTodoStatus.TODO, completedAt: null }, include })
    })
  }

  async remove(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      await this.getOwned(tx, id, user)
      return tx.personalTodo.delete({ where: { id } })
    })
  }

  async convertToTask(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    const todo = await this.prisma.withTenantTransaction(tenant, (tx) => this.getOwned(tx, id, user))
    if (todo.taskId) return { todo, task: await this.tasks.findOne(todo.taskId, user), alreadyConverted: true }
    if (todo.status === PersonalTodoStatus.CANCELLED) throw new ConflictException({ code: "PERSONAL_TODO_CANCELLED", message: "Cancelled todo cannot be converted" })
    const task = await this.tasks.create({
      title: todo.title,
      description: todo.note ?? undefined,
      dueAt: todo.dueAt?.toISOString(),
      companyId: todo.companyId ?? undefined,
      opportunityId: todo.opportunityId ?? undefined,
      assignmentScope: TaskAssignmentScope.SELF,
      assignedToId: user.userId,
    }, user)
    const updated = await this.prisma.withTenantTransaction(tenant, (tx) => tx.personalTodo.update({ where: { id }, data: { taskId: task.id, status: PersonalTodoStatus.DONE, completedAt: new Date() }, include }))
    return { todo: updated, task, alreadyConverted: false }
  }

  private async buildWhere(tx: TenantTransactionClient, query: FindPersonalTodosDto, user: CurrentUserPayload): Promise<Prisma.PersonalTodoWhereInput> {
    const tenant = tenantScope.require(user)
    const and: Prisma.PersonalTodoWhereInput[] = [{ organizationId: tenant.organizationId, userId: user.userId }]
    if (query.status) and.push({ status: query.status })
    if (query.companyId) and.push({ companyId: query.companyId })
    if (query.opportunityId) and.push({ opportunityId: query.opportunityId })
    if (query.dateState) {
      const organization = await tx.organization.findUnique({ where: { id: tenant.organizationId }, select: { timezone: true } })
      const { start, end } = organizationDayBounds(new Date(), organization?.timezone || "Asia/Tehran")
      if (query.dateState === PersonalTodoDateState.TODAY) and.push({ status: PersonalTodoStatus.TODO, dueAt: { gte: start, lt: end } })
      if (query.dateState === PersonalTodoDateState.UPCOMING) and.push({ status: PersonalTodoStatus.TODO, dueAt: { gte: end } })
      if (query.dateState === PersonalTodoDateState.OVERDUE) and.push({ status: PersonalTodoStatus.TODO, dueAt: { lt: start } })
      if (query.dateState === PersonalTodoDateState.COMPLETED) and.push({ status: PersonalTodoStatus.DONE })
    }
    return { AND: and }
  }

  private values(dto: CreatePersonalTodoDto) {
    return {
      title: this.requiredTitle(dto.title),
      note: dto.note?.trim() || undefined,
      dueAt: dto.dueAt ? parseApiDate(dto.dueAt, "dueAt") : undefined,
      reminderAt: dto.reminderAt ? parseApiDate(dto.reminderAt, "reminderAt") : undefined,
      recurrenceType: dto.recurrenceType ?? PersonalTodoRecurrenceType.NONE,
      recurrenceInterval: dto.recurrenceInterval ?? 1,
    }
  }

  private async validateRelations(dto: { companyId?: string | null; opportunityId?: string | null; taskId?: string | null }, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    if (dto.companyId) await this.companyAccess.assertCompanyReadable(dto.companyId, user)
    if (dto.opportunityId) {
      const opportunityId = dto.opportunityId
      const opportunity = await this.prisma.withTenantTransaction(tenant, (tx) => tx.opportunity.findFirst({ where: { id: opportunityId, organizationId: tenant.organizationId, archivedAt: null }, select: { id: true, companyId: true } }))
      if (!opportunity) throw new NotFoundException({ code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" })
      await this.companyAccess.assertCompanyReadable(opportunity.companyId, user)
      if (dto.companyId && dto.companyId !== opportunity.companyId) throw new BadRequestException({ code: "PERSONAL_TODO_RELATION_MISMATCH", message: "Opportunity does not belong to company" })
    }
    if (dto.taskId) await this.tasks.assertReadable(dto.taskId, user)
  }

  private async getOwned(tx: TenantTransactionClient, id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    const todo = await tx.personalTodo.findFirst({ where: { id, organizationId: tenant.organizationId, userId: user.userId }, include: { ...include, nextOccurrence: { select: { id: true, dueAt: true, status: true } } } })
    if (!todo) throw new NotFoundException({ code: "PERSONAL_TODO_NOT_FOUND", message: "Personal todo not found" })
    return todo
  }

  private async createNextOccurrence(tx: TenantTransactionClient, current: Awaited<ReturnType<PersonalTodosService["getOwned"]>>, organizationId: string, userId: string) {
    if (current.nextOccurrence || current.recurrenceType === PersonalTodoRecurrenceType.NONE || !current.dueAt) return current.nextOccurrence ?? null
    const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { timezone: true } })
    const timeZone = organization?.timezone || "Asia/Tehran"
    const nextDueAt = this.nextDate(current.dueAt, current.recurrenceType, current.recurrenceInterval, timeZone)
    const nextReminderAt = current.reminderAt ? this.nextDate(current.reminderAt, current.recurrenceType, current.recurrenceInterval, timeZone) : null
    return tx.personalTodo.create({ data: { organizationId, userId, title: current.title, note: current.note, dueAt: nextDueAt, reminderAt: nextReminderAt, recurrenceType: current.recurrenceType, recurrenceInterval: current.recurrenceInterval, companyId: current.companyId, opportunityId: current.opportunityId, previousOccurrenceId: current.id }, include })
  }

  private nextDate(date: Date, type: PersonalTodoRecurrenceType, interval: number, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date)
    const get = (key: string) => Number(parts.find((part) => part.type === key)?.value)
    let year = get("year"), month = get("month"), day = get("day")
    const days = type === PersonalTodoRecurrenceType.WEEKLY ? 7 * interval : type === PersonalTodoRecurrenceType.MONTHLY ? 0 : interval
    if (type === PersonalTodoRecurrenceType.MONTHLY) {
      const target = new Date(Date.UTC(year, month - 1 + interval, 1))
      year = target.getUTCFullYear(); month = target.getUTCMonth() + 1
      day = Math.min(day, new Date(Date.UTC(year, month, 0)).getUTCDate())
    } else {
      const target = new Date(Date.UTC(year, month - 1, day + days))
      year = target.getUTCFullYear(); month = target.getUTCMonth() + 1; day = target.getUTCDate()
    }
    const wanted = Date.UTC(year, month - 1, day, get("hour"), get("minute"), get("second"))
    let result = new Date(wanted)
    for (let index = 0; index < 3; index += 1) {
      const representedParts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(result)
      const value = (key: string) => Number(representedParts.find((part) => part.type === key)?.value)
      const represented = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"))
      result = new Date(result.getTime() + wanted - represented)
    }
    return result
  }

  private validateRecurrence(type: PersonalTodoRecurrenceType, interval: number, dueAt: Date | null | undefined) {
    if (type !== PersonalTodoRecurrenceType.NONE && !dueAt) throw new BadRequestException({ code: "PERSONAL_TODO_RECURRENCE_DUE_AT_REQUIRED", message: "Recurring todo requires dueAt" })
    if (type !== PersonalTodoRecurrenceType.CUSTOM && interval !== 1) throw new BadRequestException({ code: "PERSONAL_TODO_RECURRENCE_INTERVAL_INVALID", message: "Interval is only configurable for custom recurrence" })
  }

  private requiredTitle(value: string) {
    const title = value.trim()
    if (!title) throw new BadRequestException({ code: "PERSONAL_TODO_TITLE_REQUIRED", message: "Title is required" })
    return title
  }
}
