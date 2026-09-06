import { Injectable } from "@nestjs/common"
import { Prisma, type NotificationEvent } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import type { PublishNotificationEventInput } from "./notification-core.types"

@Injectable()
export class NotificationCoreService {
  constructor(private readonly prisma: PrismaService) {}

  async publish(input: PublishNotificationEventInput): Promise<NotificationEvent> {
    const create = () =>
      this.prisma.notificationEvent.create({
        data: {
          organizationId: input.organizationId,
          eventName: input.eventName,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          actorId: input.actorId ?? null,
          payload: (input.payload ?? {}) as Prisma.InputJsonValue,
          idempotencyKey: input.idempotencyKey ?? null,
          occurredAt: input.occurredAt ?? new Date(),
        },
      })

    if (!input.idempotencyKey) {
      return create()
    }

    const existing = await this.prisma.notificationEvent.findFirst({
      where: {
        organizationId: input.organizationId,
        idempotencyKey: input.idempotencyKey,
      },
    })
    if (existing) return existing

    try {
      return await create()
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const raced = await this.prisma.notificationEvent.findFirst({
          where: {
            organizationId: input.organizationId,
            idempotencyKey: input.idempotencyKey,
          },
        })

        if (raced) return raced
      }

      throw error
    }
  }
}
