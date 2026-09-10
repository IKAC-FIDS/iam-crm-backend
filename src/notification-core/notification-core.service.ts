import { Injectable, Logger } from "@nestjs/common"
import { Prisma, type NotificationEvent } from "@prisma/client"
import { PrismaService, type TenantTransactionClient } from "../prisma/prisma.service"
import { NotificationDeliveryDispatcher } from './notification-delivery-dispatcher.service'
import { notificationTenantContext } from './in-app/notification-tenant-context'
import type { PublishNotificationEventInput } from "./notification-core.types"
import { NotificationRuleEngineService } from "./notification-rule-engine.service"

@Injectable()
export class NotificationCoreService {
  private readonly logger = new Logger(NotificationCoreService.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: NotificationRuleEngineService,
    private readonly dispatcher: NotificationDeliveryDispatcher,
  ) {}

  async publish(input: PublishNotificationEventInput, db: TenantTransactionClient = this.prisma): Promise<NotificationEvent> {
    return (await this.publishOnce(input, db)).event
  }

  private async publishOnce(input: PublishNotificationEventInput, db: TenantTransactionClient): Promise<{ event: NotificationEvent; created: boolean }> {
    const data = {
      organizationId: input.organizationId, eventName: input.eventName,
      aggregateType: input.aggregateType, aggregateId: input.aggregateId,
      actorId: input.actorId ?? null, payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      idempotencyKey: input.idempotencyKey ?? null, occurredAt: input.occurredAt ?? new Date(),
    }
    if (!input.idempotencyKey) return { event: await db.notificationEvent.create({ data }), created: true }
    // ON CONFLICT avoids aborting the surrounding PostgreSQL transaction on a replay/race.
    const inserted = await db.notificationEvent.createMany({ data, skipDuplicates: true })
    const event = await db.notificationEvent.findFirstOrThrow({ where: {
      organizationId: input.organizationId, idempotencyKey: input.idempotencyKey,
    } })
    return { event, created: inserted.count === 1 }
  }

  async publishAndEvaluate(input: PublishNotificationEventInput) {
    const context = notificationTenantContext(input.organizationId, input.actorId ?? undefined)
    const published = await this.prisma.withTenantTransaction(context, tx => this.publishOnce(input, tx))
    const event = published.event
    if (!published.created) return { event, evaluation: null, duplicate: true }
    const evaluation = await this.prisma.withTenantTransaction(context, tx => this.ruleEngine.evaluateEvent(event, tx))
    const pending = await this.prisma.withTenantTransaction(context, tx => tx.notificationDelivery.findMany({
      where: { eventId: event.id, event: { organizationId: input.organizationId }, channel: { in: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] }, status: { in: ['PENDING', 'RETRYING'] } }, select: { id: true },
    }))
    for (const delivery of pending) {
      try {
        await this.dispatcher.dispatch(delivery.id, input.organizationId)
      } catch (error) {
        const detail = error instanceof Error ? error.stack ?? error.message : String(error)
        this.logger.error(`Notification delivery failed deliveryId=${delivery.id} organizationId=${input.organizationId}`, detail)
      }
    }
    return { event, evaluation, duplicate: false }
  }

  /** A notification failure must not turn a committed domain action into an apparent failure. */
  async publishDomainEvent(input: PublishNotificationEventInput) {
    try { return await this.publishAndEvaluate(input) }
    catch (error) {
      const detail = error instanceof Error ? error.stack ?? error.message : String(error)
      this.logger.error(`Notification event processing failed event=${input.eventName} aggregateId=${input.aggregateId} organizationId=${input.organizationId}`, detail)
      return null
    }
  }
}
