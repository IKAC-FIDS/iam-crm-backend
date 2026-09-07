import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { NotificationChannel, type Prisma } from "@prisma/client"
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator"
import { createPaginationMeta } from "../common/pagination/pagination.util"
import { tenantScope } from "../common/tenant/tenant-scope.util"
import { PrismaService } from "../prisma/prisma.service"
import { NOTIFICATION_EVENT_CATALOG } from "./notification-core.catalog"
import type {
  CreateNotificationTemplateDto,
  NotificationDeliveryQueryDto,
  NotificationTemplateQueryDto,
  PreviewNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from "./dto/notification-admin.dto"
import { NotificationTemplateEngineService } from "./notification-template-engine.service"
import { SmsSettingsService } from "./sms/sms-settings.service"

const events = Object.entries(NOTIFICATION_EVENT_CATALOG).flatMap(([service, actions]) =>
  Object.entries(actions).map(([action, eventName]) => ({ eventName, service, action })),
)
const allowedEvents = new Set<string>(events.map((item) => item.eventName))

@Injectable()
export class NotificationAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: NotificationTemplateEngineService,
    private readonly smsSettings: SmsSettingsService,
  ) {}

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
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
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

  async createTemplate(dto: CreateNotificationTemplateDto, user: CurrentUserPayload) {
    const { organizationId } = tenantScope.require(user)
    this.assertEvent(dto.eventName)
    const locale = dto.locale?.trim() || "fa-IR"
    const subject = dto.channel === NotificationChannel.SMS ? null : dto.subject?.trim() || null
    const body = dto.body.trim()
    this.requireInAppSubject(dto.channel, subject)
    this.templateEngine.validate(dto.eventName, subject, body)
    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.notificationTemplate.findFirst({
        where: { organizationId, eventName: dto.eventName, channel: dto.channel, locale },
        orderBy: { version: "desc" },
        select: { version: true },
      })
      const isActive = dto.isActive ?? true
      if (isActive) {
        await tx.notificationTemplate.updateMany({
          where: { organizationId, eventName: dto.eventName, channel: dto.channel, locale, isActive: true },
          data: { isActive: false },
        })
      }
      return tx.notificationTemplate.create({ data: {
        organizationId, eventName: dto.eventName, channel: dto.channel, locale,
        subject, body, isActive, version: (latest?.version ?? 0) + 1,
      } })
    })
  }

  async updateTemplate(id: string, dto: UpdateNotificationTemplateDto, user: CurrentUserPayload) {
    const previous = await this.getTemplate(id, user)
    if (dto.eventName) this.assertEvent(dto.eventName)
    const eventName = dto.eventName ?? previous.eventName
    const channel = dto.channel ?? previous.channel
    const locale = dto.locale?.trim() || previous.locale
    const subject = channel === NotificationChannel.SMS
      ? null
      : dto.subject !== undefined ? dto.subject?.trim() || null : previous.subject
    const body = dto.body?.trim() ?? previous.body
    this.requireInAppSubject(channel, subject)
    this.templateEngine.validate(eventName, subject, body)
    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.notificationTemplate.findFirst({
        where: { organizationId: previous.organizationId, eventName, channel, locale },
        orderBy: { version: "desc" },
        select: { version: true },
      })
      const isActive = dto.isActive ?? true
      if (isActive) {
        await tx.notificationTemplate.updateMany({
          where: { organizationId: previous.organizationId, eventName, channel, locale, isActive: true },
          data: { isActive: false },
        })
      }
      return tx.notificationTemplate.create({ data: {
        organizationId: previous.organizationId, eventName, channel, locale,
        subject, body, isActive, version: (latest?.version ?? 0) + 1,
      } })
    })
  }

  async removeTemplate(id: string, user: CurrentUserPayload) {
    await this.getTemplate(id, user)
    await this.prisma.notificationTemplate.update({ where: { id }, data: { isActive: false } })
    return { deleted: false, deactivated: true }
  }

  templateVariables(eventName: string) {
    this.assertEvent(eventName)
    return { eventName, variables: this.templateEngine.variables(eventName) }
  }

  previewTemplate(dto: PreviewNotificationTemplateDto) {
    this.assertEvent(dto.eventName)
    const subject = dto.channel === NotificationChannel.SMS ? null : dto.subject
    return {
      eventName: dto.eventName,
      channel: dto.channel,
      locale: dto.locale?.trim() || "fa-IR",
      ...this.templateEngine.preview(dto.eventName, subject, dto.body),
    }
  }

  async activateTemplate(id: string, user: CurrentUserPayload) {
    const template = await this.getTemplate(id, user)
    this.requireInAppSubject(template.channel, template.subject)
    return this.prisma.$transaction(async (tx) => {
      await tx.notificationTemplate.updateMany({
        where: {
          organizationId: template.organizationId,
          eventName: template.eventName,
          channel: template.channel,
          locale: template.locale,
          isActive: true,
        },
        data: { isActive: false },
      })
      return tx.notificationTemplate.update({ where: { id: template.id }, data: { isActive: true } })
    })
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
      await this.smsSettings.status(organizationId),
      { channel: "PUSH", available: false, configured: false, usable: false, provider: null, configurationPath: null },
      { channel: "IN_APP", available: true, configured: true, enabled: true, usable: true, provider: "Notification Center", configurationPath: null },
    ]
  }

  private assertEvent(eventName: string) {
    if (!allowedEvents.has(eventName)) throw new BadRequestException(`Unsupported notification event: ${eventName}`)
  }
  private requireInAppSubject(channel: NotificationChannel, subject: string | null | undefined) {
    if (channel === NotificationChannel.IN_APP && !subject?.trim()) throw new BadRequestException('عنوان قالب اعلان داخل سامانه الزامی است');
  }
  private date(value: string, field: string) {
    const result = new Date(value)
    if (Number.isNaN(result.getTime())) throw new BadRequestException(`${field} is invalid`)
    return result
  }
}
