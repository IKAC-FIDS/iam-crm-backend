import { Injectable, Logger } from "@nestjs/common"
import { Cron } from "@nestjs/schedule"
import { NotificationEntityType, NotificationType, OrganizationStatus, PersonalTodoStatus, Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class PersonalTodoReminderService {
  private readonly logger = new Logger(PersonalTodoReminderService.name)

  constructor(private readonly prisma: PrismaService) {}

  @Cron("0 * * * * *")
  async processDueReminders() {
    try {
      await this.prisma.$transaction(async (tx) => {
        const lock = await tx.$queryRaw<Array<{ locked: boolean }>>(Prisma.sql`SELECT pg_try_advisory_xact_lock(73644292) AS locked`)
        if (!lock[0]?.locked) return
        const todos = await tx.personalTodo.findMany({
          where: {
            status: PersonalTodoStatus.TODO,
            reminderAt: { lte: new Date() },
            reminderSentAt: null,
            organization: { status: OrganizationStatus.ACTIVE },
          },
          orderBy: { reminderAt: "asc" },
          take: 100,
        })
        for (const todo of todos) {
          await this.prisma.installTenantContext(tx, {
            tenantId: todo.organizationId,
            organizationId: todo.organizationId,
            userId: todo.userId,
            membershipId: `personal-todo-reminder:${todo.id}`,
            tenantRole: "SYSTEM",
            permissions: [],
            platformAdmin: false,
            membershipStatus: "active",
            resolutionSource: "authenticated-membership",
          })
          await tx.notification.create({
            data: {
              organizationId: todo.organizationId,
              recipientId: todo.userId,
              type: NotificationType.PERSONAL_TODO_REMINDER,
              title: "یادآوری کار شخصی",
              body: todo.title,
              entityType: NotificationEntityType.PERSONAL_TODO,
              entityId: todo.id,
              actionUrl: "/operations",
              metadata: { dueAt: todo.dueAt?.toISOString() ?? null } satisfies Prisma.InputJsonObject,
            },
          })
          await tx.personalTodo.update({ where: { id: todo.id }, data: { reminderSentAt: new Date() } })
        }
      }, { timeout: 30_000 })
    } catch (error) {
      this.logger.error("Personal todo reminder processing failed", error instanceof Error ? error.stack : undefined)
    }
  }
}
