import { Injectable, Logger } from "@nestjs/common"
import { NotificationDeliveryStatus, Prisma, type NotificationChannel, type NotificationDelivery, type NotificationEvent } from "@prisma/client"
import type { TenantTransactionClient } from "../../prisma/prisma.service"
import { NotificationDeduplicationKeyService } from "./notification-deduplication-key.service"

export type CreatePendingDeliveryInput = {
  event: NotificationEvent
  ruleId?: string | null
  recipientRuleId?: string | null
  recipientUserId: string
  templateId?: string | null
  channel: NotificationChannel
}

export type DeliveryCreationResult =
  | { status: "CREATED"; delivery: NotificationDelivery }
  | { status: "DUPLICATE"; delivery: NotificationDelivery }

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name)
  constructor(private readonly identities: NotificationDeduplicationKeyService) {}

  async createPendingDelivery(input: CreatePendingDeliveryInput, db: TenantTransactionClient): Promise<DeliveryCreationResult> {
    const eventOccurrenceKey = this.identities.eventOccurrence(input.event)
    const deduplicationKey = this.identities.build({ organizationId: input.event.organizationId, eventOccurrenceKey, recipientUserId: input.recipientUserId, channel: input.channel })
    const data = {
      organizationId: input.event.organizationId,
      eventId: input.event.id,
      ruleId: input.ruleId ?? null,
      recipientRuleId: input.recipientRuleId ?? null,
      recipientUserId: input.recipientUserId,
      templateId: input.templateId ?? null,
      channel: input.channel,
      status: NotificationDeliveryStatus.PENDING,
      deduplicationKey,
    }
    try {
      const inserted = await db.notificationDelivery.createMany({ data, skipDuplicates: true })
      const delivery = await db.notificationDelivery.findUniqueOrThrow({ where: { organizationId_deduplicationKey: { organizationId: input.event.organizationId, deduplicationKey } } })
      if (inserted.count === 1) {
        this.log("delivery.created", input, delivery.id)
        return { status: "CREATED", delivery }
      }
      this.log("delivery.duplicate_skipped", input, delivery.id)
      return { status: "DUPLICATE", delivery }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const delivery = await db.notificationDelivery.findUniqueOrThrow({ where: { organizationId_deduplicationKey: { organizationId: input.event.organizationId, deduplicationKey } } })
        this.log("delivery.unique_conflict", input, delivery.id)
        return { status: "DUPLICATE", delivery }
      }
      throw error
    }
  }

  private log(event: string, input: CreatePendingDeliveryInput, deliveryId: string) {
    this.logger.log(JSON.stringify({ event, organizationId: input.event.organizationId, eventName: input.event.eventName, recipientUserId: input.recipientUserId, channel: input.channel, deliveryId }))
  }
}
