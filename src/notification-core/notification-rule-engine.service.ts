import { Injectable, NotFoundException } from "@nestjs/common"
import {
  NotificationDeliveryStatus,
  NotificationRecipientType,
  OrganizationMembershipStatus,
  type NotificationEvent,
  type NotificationRecipientRule,
  Prisma,
} from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { NotificationTemplateEngineService } from "./notification-template-engine.service"

@Injectable()
export class NotificationRuleEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: NotificationTemplateEngineService,
  ) {}

  async evaluateEvent(event: NotificationEvent) {
    const rules = await this.prisma.notificationRule.findMany({
      where: {
        organizationId: event.organizationId,
        eventName: event.eventName,
        enabled: true,
      },
      include: {
        recipientRules: {
          where: { enabled: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    })

    let created = 0
    let duplicate = 0
    let unresolved = 0

    for (const rule of rules) {
      for (const recipientRule of rule.recipientRules) {
        const recipientIds = await this.resolveRecipientIds(event, recipientRule)
        if (!recipientIds.length) {
          unresolved += recipientRule.channels.length
          continue
        }

        for (const recipientUserId of recipientIds) {
          for (const channel of recipientRule.channels) {
            const deduplicationKey = [
              event.id,
              rule.id,
              recipientRule.id,
              recipientUserId,
              channel,
            ].join(":")

            try {
              const rendered = await this.templateEngine.renderDelivery(event, recipientUserId, channel)
              await this.prisma.notificationDelivery.create({
                data: {
                  eventId: event.id,
                  ruleId: rule.id,
                  recipientRuleId: recipientRule.id,
                  recipientUserId,
                  templateId: rendered.template.id,
                  channel,
                  status: NotificationDeliveryStatus.PENDING,
                  deduplicationKey,
                },
              })
              created += 1
            } catch (error) {
              if (error instanceof NotFoundException) {
                unresolved += 1
                continue
              }
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
              ) {
                duplicate += 1
                continue
              }
              throw error
            }
          }
        }
      }
    }

    return { rules: rules.length, created, duplicate, unresolved }
  }

  private async resolveRecipientIds(
    event: NotificationEvent,
    rule: NotificationRecipientRule,
  ): Promise<string[]> {
    switch (rule.type) {
      case NotificationRecipientType.USER:
        return this.activeUsers(event.organizationId, rule.targetId ? [rule.targetId] : [])

      case NotificationRecipientType.ROLE:
        return this.usersByRole(event.organizationId, rule.targetId)

      case NotificationRecipientType.TEAM:
        return this.usersByTeam(event.organizationId, rule.targetId)

      case NotificationRecipientType.ASSIGNEE:
        return this.aggregateAssignees(event)

      case NotificationRecipientType.CREATOR:
        return this.aggregateCreator(event)

      case NotificationRecipientType.OWNER:
        return this.payloadIds(event, "ownerUserId")

      case NotificationRecipientType.MANAGER:
        return this.aggregateManagers(event)

      default:
        return []
    }
  }

  private async usersByRole(organizationId: string, roleId: string | null) {
    if (!roleId) return []
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId, roleId },
          {
            organizationMemberships: {
              some: {
                organizationId,
                status: OrganizationMembershipStatus.ACTIVE,
                roleId,
              },
            },
          },
        ],
      },
      select: { id: true },
    })
    return this.unique(users.map((item) => item.id))
  }

  private async usersByTeam(organizationId: string, teamId: string | null) {
    if (!teamId) return []
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { organizationId, teamId },
          {
            organizationMemberships: {
              some: {
                organizationId,
                status: OrganizationMembershipStatus.ACTIVE,
                teamId,
              },
            },
          },
        ],
      },
      select: { id: true },
    })
    return this.unique(users.map((item) => item.id))
  }

  private async aggregateAssignees(event: NotificationEvent) {
    if (event.aggregateType === "MEETING") {
      const rows = await this.prisma.meetingAssignee.findMany({
        where: {
          meetingId: event.aggregateId,
          meeting: { organizationId: event.organizationId },
        },
        select: { userId: true },
      })
      return this.activeUsers(event.organizationId, rows.map((row) => row.userId))
    }

    if (event.aggregateType === "TASK") {
      const task = await this.prisma.task.findFirst({
        where: { id: event.aggregateId, organizationId: event.organizationId },
        select: { assignedToId: true },
      })
      return this.activeUsers(
        event.organizationId,
        task?.assignedToId ? [task.assignedToId] : [],
      )
    }

    return this.payloadIds(event, "assigneeUserIds")
  }

  private async aggregateCreator(event: NotificationEvent) {
    if (event.aggregateType === "MEETING") {
      const meeting = await this.prisma.meeting.findFirst({
        where: { id: event.aggregateId, organizationId: event.organizationId },
        select: { createdById: true },
      })
      return this.activeUsers(
        event.organizationId,
        meeting?.createdById ? [meeting.createdById] : [],
      )
    }

    if (event.aggregateType === "TASK") {
      const task = await this.prisma.task.findFirst({
        where: { id: event.aggregateId, organizationId: event.organizationId },
        select: { createdById: true },
      })
      return this.activeUsers(
        event.organizationId,
        task?.createdById ? [task.createdById] : [],
      )
    }

    return this.payloadIds(event, "creatorUserId")
  }

  private async aggregateManagers(event: NotificationEvent) {
    let teamIds: string[] = []

    if (event.aggregateType === "TASK") {
      const task = await this.prisma.task.findFirst({
        where: { id: event.aggregateId, organizationId: event.organizationId },
        select: { teamId: true, assignedTo: { select: { teamId: true } } },
      })
      teamIds = [task?.teamId, task?.assignedTo?.teamId].filter(
        (value): value is string => Boolean(value),
      )
    } else if (event.aggregateType === "MEETING") {
      const rows = await this.prisma.meetingAssignee.findMany({
        where: {
          meetingId: event.aggregateId,
          meeting: { organizationId: event.organizationId },
        },
        select: { user: { select: { teamId: true } } },
      })
      teamIds = rows
        .map((row) => row.user.teamId)
        .filter((value): value is string => Boolean(value))
    }

    if (!teamIds.length) return this.payloadIds(event, "managerUserIds")

    const teams = await this.prisma.team.findMany({
      where: {
        id: { in: this.unique(teamIds) },
        organizationId: event.organizationId,
        isActive: true,
      },
      select: { managerId: true },
    })
    return this.activeUsers(
      event.organizationId,
      teams
        .map((team) => team.managerId)
        .filter((value): value is string => Boolean(value)),
    )
  }

  private async payloadIds(event: NotificationEvent, key: string) {
    const payload =
      event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
        ? (event.payload as Record<string, unknown>)
        : {}
    const value = payload[key]
    const ids = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : typeof value === "string"
        ? [value]
        : []
    return this.activeUsers(event.organizationId, ids)
  }

  private async activeUsers(organizationId: string, ids: string[]) {
    const uniqueIds = this.unique(ids)
    if (!uniqueIds.length) return []
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds }, organizationId, isActive: true },
      select: { id: true },
    })
    return users.map((user) => user.id)
  }

  private unique(values: string[]) {
    return [...new Set(values)]
  }
}
