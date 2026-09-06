import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  NotificationChannel,
  NotificationRecipientType,
  RoleScope,
  type Prisma,
} from "@prisma/client"
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator"
import { tenantScope } from "../common/tenant/tenant-scope.util"
import { PrismaService } from "../prisma/prisma.service"
import type {
  CreateNotificationRuleDto,
  NotificationRecipientRuleInputDto,
  UpdateNotificationRuleDto,
} from "./dto/notification-rule.dto"
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_CATALOG,
} from "./notification-core.catalog"

const ruleInclude = {
  recipientRules: {
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.NotificationRuleInclude

const ALLOWED_EVENTS = new Set<string>([
  ...Object.values(NOTIFICATION_EVENT_CATALOG.MEETING),
  ...Object.values(NOTIFICATION_EVENT_CATALOG.TASK),
])
const ALLOWED_CHANNELS = new Set<string>(NOTIFICATION_CHANNELS)

@Injectable()
export class NotificationRulesService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    return this.prisma.notificationRule.findMany({
      where: { organizationId: tenant.organizationId },
      include: ruleInclude,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    })
  }

  async get(id: string, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    const rule = await this.prisma.notificationRule.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: ruleInclude,
    })
    if (!rule) throw new NotFoundException("Notification rule not found")
    return rule
  }

  async create(dto: CreateNotificationRuleDto, user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    this.validateEvent(dto.eventName)
    await this.validateRecipients(dto.recipientRules, tenant.organizationId)

    return this.prisma.notificationRule.create({
      data: {
        organizationId: tenant.organizationId,
        name: dto.name.trim(),
        eventName: dto.eventName,
        enabled: dto.enabled ?? true,
        mandatory: dto.mandatory ?? false,
        priority: dto.priority ?? 100,
        recipientRules: {
          create: dto.recipientRules.map((recipient) =>
            this.recipientCreateData(recipient),
          ),
        },
      },
      include: ruleInclude,
    })
  }

  async update(
    id: string,
    dto: UpdateNotificationRuleDto,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user)
    await this.get(id, user)
    if (dto.eventName) this.validateEvent(dto.eventName)
    if (dto.recipientRules) {
      await this.validateRecipients(dto.recipientRules, tenant.organizationId)
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.recipientRules) {
        await tx.notificationRecipientRule.deleteMany({ where: { ruleId: id } })
      }

      return tx.notificationRule.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.eventName !== undefined ? { eventName: dto.eventName } : {}),
          ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
          ...(dto.mandatory !== undefined ? { mandatory: dto.mandatory } : {}),
          ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
          ...(dto.recipientRules
            ? {
                recipientRules: {
                  create: dto.recipientRules.map((recipient) =>
                    this.recipientCreateData(recipient),
                  ),
                },
              }
            : {}),
        },
        include: ruleInclude,
      })
    })
  }

  async remove(id: string, user: CurrentUserPayload) {
    await this.get(id, user)
    await this.prisma.notificationRule.delete({ where: { id } })
    return { deleted: true }
  }

  catalog() {
    return {
      events: [...ALLOWED_EVENTS],
      recipientTypes: Object.values(NotificationRecipientType),
      channels: Object.values(NotificationChannel),
    }
  }

  async userTargets(user: CurrentUserPayload, search?: string) {
    const tenant = tenantScope.require(user)
    return this.prisma.user.findMany({
      where: {
        organizationId: tenant.organizationId,
        isActive: true,
        ...(search?.trim()
          ? {
              OR: [
                { fullName: { contains: search.trim(), mode: "insensitive" } },
                { email: { contains: search.trim(), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
      take: 100,
    })
  }

  async teamTargets(user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    return this.prisma.team.findMany({
      where: { organizationId: tenant.organizationId, isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    })
  }

  async roleTargets(user: CurrentUserPayload) {
    const tenant = tenantScope.require(user)
    return this.prisma.role.findMany({
      where: {
        isActive: true,
        OR: [
          { scope: RoleScope.SYSTEM },
          { scope: RoleScope.TENANT, organizationId: tenant.organizationId },
        ],
      },
      select: {
        id: true,
        code: true,
        normalizedCode: true,
        name: true,
        scope: true,
        baseRole: true,
      },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
      take: 100,
    })
  }

  private validateEvent(eventName: string) {
    if (!ALLOWED_EVENTS.has(eventName)) {
      throw new BadRequestException(`Unsupported notification event: ${eventName}`)
    }
  }

  private recipientCreateData(recipient: NotificationRecipientRuleInputDto) {
    return {
      type: recipient.type,
      targetId: recipient.targetId ?? null,
      channels: [...new Set(recipient.channels)],
      enabled: recipient.enabled ?? true,
    }
  }

  private async validateRecipients(
    recipients: NotificationRecipientRuleInputDto[],
    organizationId: string,
  ) {
    for (const recipient of recipients) {
      const channels = [...new Set(recipient.channels)]
      if (!channels.length || channels.some((channel) => !ALLOWED_CHANNELS.has(channel))) {
        throw new BadRequestException("Recipient must define supported channels")
      }

      const requiresTarget =
        recipient.type === NotificationRecipientType.USER ||
        recipient.type === NotificationRecipientType.ROLE ||
        recipient.type === NotificationRecipientType.TEAM

      if (requiresTarget && !recipient.targetId) {
        throw new BadRequestException(`${recipient.type} recipient requires targetId`)
      }
      if (!requiresTarget && recipient.targetId) {
        throw new BadRequestException(
          `${recipient.type} recipient must not define targetId`,
        )
      }

      if (recipient.type === NotificationRecipientType.USER && recipient.targetId) {
        const target = await this.prisma.user.findFirst({
          where: {
            id: recipient.targetId,
            organizationId,
            isActive: true,
          },
          select: { id: true },
        })
        if (!target) throw new BadRequestException("Recipient user is unavailable")
      }

      if (recipient.type === NotificationRecipientType.TEAM && recipient.targetId) {
        const target = await this.prisma.team.findFirst({
          where: {
            id: recipient.targetId,
            organizationId,
            isActive: true,
          },
          select: { id: true },
        })
        if (!target) throw new BadRequestException("Recipient team is unavailable")
      }

      if (recipient.type === NotificationRecipientType.ROLE && recipient.targetId) {
        const target = await this.prisma.role.findFirst({
          where: {
            id: recipient.targetId,
            isActive: true,
            OR: [
              { scope: RoleScope.SYSTEM },
              { scope: RoleScope.TENANT, organizationId },
            ],
          },
          select: { id: true },
        })
        if (!target) throw new BadRequestException("Recipient role is unavailable")
      }
    }
  }
}
