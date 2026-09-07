import { BadRequestException, Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import type { NotificationChannelHandler } from "./notification-channel-handler"
import { SmsNotificationChannelHandler } from "./sms/sms-notification-channel.handler"
import { InAppNotificationChannelHandler } from './in-app/in-app-notification-channel.handler'
import { notificationTenantContext } from './in-app/notification-tenant-context'

@Injectable()
export class NotificationDeliveryDispatcher {
  private readonly handlers: Map<string, NotificationChannelHandler>
  constructor(private readonly prisma: PrismaService, sms: SmsNotificationChannelHandler, inApp: InAppNotificationChannelHandler) {
    this.handlers = new Map<string, NotificationChannelHandler>([[sms.channel, sms], [inApp.channel, inApp]])
  }
  async dispatch(deliveryId: string, organizationId: string) {
    const delivery = await this.prisma.withTenantTransaction(notificationTenantContext(organizationId), tx => tx.notificationDelivery.findFirst({ where: { id: deliveryId, event: { organizationId } }, select: { id: true, channel: true } }))
    if (!delivery) throw new BadRequestException("Delivery در سازمان جاری یافت نشد")
    const handler = this.handlers.get(delivery.channel)
    if (!handler) throw new BadRequestException(`کانال ${delivery.channel} هنوز dispatcher ندارد`)
    return handler.dispatch(delivery.id, organizationId)
  }
}
