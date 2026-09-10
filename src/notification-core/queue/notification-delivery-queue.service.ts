import { BadRequestException, Injectable } from "@nestjs/common"
import { NotificationDeliveryStatus as Status } from "@prisma/client"
import { PrismaService } from "../../prisma/prisma.service"
import { notificationTenantContext } from "../in-app/notification-tenant-context"

@Injectable()
export class NotificationDeliveryQueueService {
  constructor(private readonly prisma: PrismaService) {}

  maxAttempts() { return this.integer("NOTIFICATION_RETRY_MAX_ATTEMPTS", 5, 1, 20) }
  batchSize() { return this.integer("NOTIFICATION_WORKER_BATCH_SIZE", 50, 1, 500) }
  leaseMs() { return this.integer("NOTIFICATION_PROCESSING_LEASE_SECONDS", 300, 30, 3600) * 1000 }

  retryDelayMs(attemptCount: number) {
    const base = this.integer("NOTIFICATION_RETRY_BASE_DELAY_SECONDS", 30, 1, 3600) * 1000
    const maximum = this.integer("NOTIFICATION_RETRY_MAX_DELAY_SECONDS", 3600, 1, 86400) * 1000
    return Math.min(maximum, base * 2 ** Math.max(0, attemptCount - 1))
  }

  async due(organizationId: string, now = new Date()) {
    return this.prisma.withTenantTransaction(notificationTenantContext(organizationId), tx => tx.notificationDelivery.findMany({
      where: { event: { organizationId }, status: { in: [Status.PENDING, Status.RETRYING] }, OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }] },
      select: { id: true }, orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }], take: this.batchSize(),
    }))
  }

  async recoverStale(organizationId: string, now = new Date()) {
    const expiredBefore = new Date(now.getTime() - this.leaseMs())
    return this.prisma.withTenantTransaction(notificationTenantContext(organizationId), tx => tx.notificationDelivery.updateMany({
      where: { event: { organizationId }, status: Status.PROCESSING, processingStartedAt: { lte: expiredBefore } },
      data: { status: Status.RETRYING, nextAttemptAt: now, processingStartedAt: null, failureCode: "PROCESSING_LEASE_EXPIRED", failureMessage: "پردازش قبلی کامل نشد و برای تلاش مجدد بازیابی شد" },
    }))
  }

  async handleFailure(deliveryId: string, organizationId: string, reason?: string) {
    return this.prisma.withTenantTransaction(notificationTenantContext(organizationId), async tx => {
      const delivery = await tx.notificationDelivery.findFirst({ where: { id: deliveryId, event: { organizationId }, status: { in: [Status.FAILED, Status.PROCESSING] } }, select: { id: true, attemptCount: true, failureMessage: true } })
      if (!delivery) return null
      const exhausted = delivery.attemptCount >= this.maxAttempts()
      return tx.notificationDelivery.update({ where: { id: delivery.id }, data: {
        status: exhausted ? Status.FAILED : Status.RETRYING,
        nextAttemptAt: exhausted ? null : new Date(Date.now() + this.retryDelayMs(delivery.attemptCount)),
        processingStartedAt: null,
        failureCode: exhausted ? "RETRY_EXHAUSTED" : reason || "DELIVERY_RETRY_SCHEDULED",
        failureMessage: delivery.failureMessage || reason || "ارسال اعلان موقتاً ناموفق بود",
      } })
    })
  }

  async retryNow(deliveryId: string, organizationId: string) {
    return this.prisma.withTenantTransaction(notificationTenantContext(organizationId), async tx => {
      const delivery = await tx.notificationDelivery.findFirst({ where: { id: deliveryId, event: { organizationId } }, select: { id: true, status: true } })
      if (!delivery) throw new BadRequestException("Delivery در سازمان جاری یافت نشد")
      const terminal = new Set<Status>([Status.SENT, Status.DELIVERED, Status.SKIPPED, Status.PROCESSING])
      if (terminal.has(delivery.status)) throw new BadRequestException("این ارسال در وضعیت قابل تلاش مجدد نیست")
      return tx.notificationDelivery.update({ where: { id: delivery.id }, data: { status: Status.RETRYING, attemptCount: 0, nextAttemptAt: new Date(), processingStartedAt: null, failureCode: null, failureMessage: null } })
    })
  }

  private integer(name: string, fallback: number, minimum: number, maximum: number) {
    const value = Number(process.env[name] ?? fallback)
    return Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback
  }
}
