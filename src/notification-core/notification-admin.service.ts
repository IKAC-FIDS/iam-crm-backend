import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator"
import { createPaginationMeta } from "../common/pagination/pagination.util"
import { tenantScope } from "../common/tenant/tenant-scope.util"
import { PrismaService } from "../prisma/prisma.service"
import { NOTIFICATION_EVENT_CATALOG } from "./notification-core.catalog"
import type {
  CreateNotificationTemplateDto,
  NotificationDeliveryQueryDto,
  NotificationTemplateQueryDto,
  UpdateNotificationTemplateDto,
} from "./dto/notification-admin.dto"

const events = Object.entries(NOTIFICATION_EVENT_CATALOG).flatMap(([service, actions]) =>
  Object.entries(actions).map(([action, eventName]) => ({ eventName, service, action })),
)
const allowedEvents = new Set<string>(events.map((item) => item.eventName))

@Injectable()
export class NotificationAdminService {
  constructor(private readonly prisma: PrismaService) {}

  catalog() {
    return { events }
  }

  listTemplates(query: NotificationTemplateQueryDto, user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    return this.prisma.notificationTemplate.findMany({
      where: {
        organizationId,
        ...(query.eventName ? { eventName: query.eventName } : {}),
        ...(query.channel ? { channel: query.channel } : {}),
        ...(query.locale ? { locale: query.locale } : {}),
        ...(query.search?.trim()
          ? { OR: [{ subject: { contains: query.search.trim(), mode: "insensitive" } }, { body: { contains: query.search.trim(), mode: "insensitive" } }] }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { version: "desc" }],
    })
  }

  async getTemplate(id: string, user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    const item = await this.prisma.notificationTemplate.findFirst({ where: { id, organizationId } })
    if (!item) throw new NotFoundException("Notification template not found")
    return item
  }

  createTemplate(dto: CreateNotificationTemplateDto, user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    this.assertEvent(dto.eventName)
    return this.prisma.notificationTemplate.create({ data: {
      organizationId, eventName: dto.eventName, channel: dto.channel,
      locale: dto.locale?.trim() || "fa-IR", subject: dto.subject?.trim() || null,
      body: dto.body.trim(), isActive: dto.isActive ?? true, version: dto.version ?? 1,
    } })
  }

  async updateTemplate(id: string, dto: UpdateNotificationTemplateDto, user: CurrentUserPayload) {
    await this.getTemplate(id, user)
    if (dto.eventName) this.assertEvent(dto.eventName)
    return this.prisma.notificationTemplate.update({ where: { id }, data: {
      ...(dto.eventName !== undefined ? { eventName: dto.eventName } : {}),
      ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
      ...(dto.locale !== undefined ? { locale: dto.locale.trim() } : {}),
      ...(dto.subject !== undefined ? { subject: dto.subject?.trim() || null } : {}),
      ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.version !== undefined ? { version: dto.version } : {}),
    } })
  }

  async removeTemplate(id: string, user: CurrentUserPayload) {
    await this.getTemplate(id, user)
    await this.prisma.notificationTemplate.delete({ where: { id } })
    return { deleted: true }
  }

  async listDeliveries(query: NotificationDeliveryQueryDto, user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    const page = query.page || 1, limit = query.pageSize || 20
    const createdAt: Prisma.DateTimeFilter = {}
    if (query.dateFrom) createdAt.gte = this.date(query.dateFrom, "dateFrom")
    if (query.dateTo) createdAt.lte = this.date(query.dateTo, "dateTo")
    const where: Prisma.NotificationDeliveryWhereInput = {
      event: { organizationId, ...(query.eventName ? { eventName: query.eventName } : {}) },
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.recipientUserId ? { recipientUserId: query.recipientUserId } : {}),
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(query.search?.trim() ? { OR: [
        { destination: { contains: query.search.trim(), mode: "insensitive" } },
        { failureMessage: { contains: query.search.trim(), mode: "insensitive" } },
        { providerMessageId: { contains: query.search.trim(), mode: "insensitive" } },
        { recipientUser: { is: { OR: [
          { fullName: { contains: query.search.trim(), mode: "insensitive" } },
          { email: { contains: query.search.trim(), mode: "insensitive" } },
        ] } } },
      ] } : {}),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.notificationDelivery.findMany({ where, include: {
        event: { select: { eventName: true, occurredAt: true } },
        recipientUser: { select: { id: true, fullName: true, email: true } },
      }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.notificationDelivery.count({ where }),
    ])
    return { data, meta: createPaginationMeta(page, limit, total) }
  }

  async getDelivery(id: string, user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    const item = await this.prisma.notificationDelivery.findFirst({ where: { id, event: { organizationId } }, include: { event: true, recipientUser: { select: { id: true, fullName: true, email: true } }, rule: { select: { id: true, name: true } }, template: true } })
    if (!item) throw new NotFoundException("Notification delivery not found")
    return item
  }

  async channelStatus(user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    const email = await this.prisma.organizationSettings.findUnique({ where: { organizationId }, select: { smtpEnabled: true, smtpHost: true, smtpPort: true, smtpFromEmail: true } })
    const emailConfigured = Boolean(email?.smtpEnabled && email.smtpHost && email.smtpPort && email.smtpFromEmail)
    return [
      { channel: "EMAIL", available: emailConfigured, configured: emailConfigured, usable: emailConfigured, provider: email?.smtpHost || null, configurationPath: "/admin/email-settings" },
      { channel: "SMS", available: false, configured: false, usable: false, provider: null, configurationPath: null },
      { channel: "PUSH", available: false, configured: false, usable: false, provider: null, configurationPath: null },
      { channel: "IN_APP", available: true, configured: true, usable: true, provider: "Notification Center", configurationPath: null },
    ]
  }

  private assertEvent(eventName: string) {
    if (!allowedEvents.has(eventName)) throw new BadRequestException(`Unsupported notification event: ${eventName}`)
  }
  private date(value: string, field: string) {
    const result = new Date(value)
    if (Number.isNaN(result.getTime())) throw new BadRequestException(`${field} is invalid`)
    return result
  }
}
