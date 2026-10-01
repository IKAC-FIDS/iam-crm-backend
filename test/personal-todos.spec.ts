import { PersonalTodoRecurrenceType, PersonalTodoStatus, UserRole } from "@prisma/client"
import { PersonalTodosService } from "../src/personal-todos/personal-todos.service"
import { tenantUser } from "./helpers/tenant-user"

const organizationId = "00000000-0000-4000-8000-000000000001"
const user = tenantUser({ userId: "00000000-0000-4000-8000-000000000002", email: "rep@example.com", role: UserRole.REP, organizationId })

function setup(todo: Record<string, unknown> = {}) {
  const record = { id: "todo-1", organizationId, userId: user.userId, title: "پیگیری", note: null, status: PersonalTodoStatus.TODO, dueAt: new Date("2026-10-01T08:00:00Z"), reminderAt: null, recurrenceType: PersonalTodoRecurrenceType.NONE, recurrenceInterval: 1, companyId: null, opportunityId: null, taskId: null, nextOccurrence: null, ...todo }
  const tx = {
    organization: { findUnique: jest.fn().mockResolvedValue({ timezone: "Asia/Tehran" }) },
    personalTodo: {
      findFirst: jest.fn().mockResolvedValue(record), findMany: jest.fn().mockResolvedValue([record]), count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockImplementation(({ data }) => ({ id: "created", status: PersonalTodoStatus.TODO, ...data })),
      update: jest.fn().mockImplementation(({ data }) => ({ ...record, ...data })), updateMany: jest.fn().mockResolvedValue({ count: 1 }), delete: jest.fn().mockResolvedValue(record), findUniqueOrThrow: jest.fn().mockResolvedValue({ ...record, status: PersonalTodoStatus.DONE }),
    },
    opportunity: { findFirst: jest.fn() },
  }
  const prisma = { withTenantTransaction: jest.fn((_tenant, callback) => callback(tx)) }
  const tasks = { create: jest.fn().mockResolvedValue({ id: "task-1" }), findOne: jest.fn(), assertReadable: jest.fn() }
  const companies = { assertCompanyReadable: jest.fn() }
  return { service: new PersonalTodosService(prisma as any, tasks as any, companies as any), tx, prisma, tasks, companies }
}

describe("PersonalTodosService", () => {
  it("always scopes reads to the authenticated owner and tenant", async () => {
    const { service, tx, prisma } = setup()
    await service.findAll({ page: 1, limit: 20 } as any, user)
    expect(tx.personalTodo.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { AND: expect.arrayContaining([{ organizationId, userId: user.userId }]) } }))
    expect(prisma.withTenantTransaction).toHaveBeenCalledWith((user as any).tenantContext, expect.any(Function))
  })

  it("creates a private todo for the current user", async () => {
    const { service, tx } = setup()
    await service.create({ title: " تماس " } as any, user)
    expect(tx.personalTodo.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId, userId: user.userId, title: "تماس" }) }))
  })

  it("completes and reopens a todo", async () => {
    const { service, tx } = setup()
    await service.complete("todo-1", user)
    expect(tx.personalTodo.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: PersonalTodoStatus.DONE }) }))
    await service.reopen("todo-1", user)
    expect(tx.personalTodo.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { status: PersonalTodoStatus.TODO, completedAt: null } }))
  })

  it("creates exactly one next occurrence for a recurring todo", async () => {
    const { service, tx } = setup({ recurrenceType: PersonalTodoRecurrenceType.DAILY })
    await service.complete("todo-1", user)
    expect(tx.personalTodo.create).toHaveBeenCalledTimes(1)
    expect(tx.personalTodo.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ previousOccurrenceId: "todo-1" }) }))
  })

  it("does not duplicate an existing recurrence", async () => {
    const { service, tx } = setup({ recurrenceType: PersonalTodoRecurrenceType.DAILY, nextOccurrence: { id: "todo-2" } })
    await service.complete("todo-1", user)
    expect(tx.personalTodo.create).not.toHaveBeenCalled()
  })

  it("converts through TasksService and keeps the generated relation", async () => {
    const { service, tasks, tx } = setup({ companyId: "company-1" })
    await service.convertToTask("todo-1", user)
    expect(tasks.create).toHaveBeenCalledWith(expect.objectContaining({ title: "پیگیری", companyId: "company-1", assignedToId: user.userId }), user)
    expect(tx.personalTodo.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ taskId: "task-1", status: PersonalTodoStatus.DONE }) }))
  })
})
