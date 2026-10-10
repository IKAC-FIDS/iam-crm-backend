import { NotificationChannel } from "@prisma/client"
import type { TenantContext } from "../src/common/tenant/tenant-context.types"
import { PushNotificationChannelHandler } from "../src/notification-core/push/push-notification-channel.handler"
import { PushSubscriptionController } from "../src/notification-core/push/push.controller"
import { PushSettingsService } from "../src/notification-core/push/push-settings.service"
import { NotificationRulesService } from "../src/notification-core/notification-rules.service"

const context: TenantContext = {
  tenantId: "org-a",
  organizationId: "org-a",
  userId: "user-a",
  membershipId: "membership-a",
  tenantRole: "REP",
  permissions: [],
  platformAdmin: false,
  membershipStatus: "active",
  resolutionSource: "token-session",
}

describe("desktop push channel", () => {
  it("is registered as the DESKTOP_PUSH notification channel", () => {
    const handler = new PushNotificationChannelHandler(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    )

    expect(handler.channel).toBe(NotificationChannel.DESKTOP_PUSH)
  })

  it("exposes DESKTOP_PUSH to the existing rule engine catalog", () => {
    const rules = new NotificationRulesService(
      {} as never,
      {} as never,
      {} as never,
    )

    expect(rules.catalog().channels).toContain(NotificationChannel.DESKTOP_PUSH)
  })

  it("sends the user-facing test only to the authenticated user", async () => {
    const push = { test: jest.fn().mockResolvedValue({ successful: 1 }) }
    const controller = new PushSubscriptionController(push as never)

    await expect(
      controller.test({ userId: context.userId, email: "user@example.com", role: "REP", tenantContext: context }),
    ).resolves.toEqual({ successful: 1 })
    expect(push.test).toHaveBeenCalledWith(context, { recipientUserId: context.userId })
  })
})

describe("desktop push subscriptions", () => {
  const settings = {
    provider: "WEB_PUSH",
    publicKey: "public",
    privateKeyEnc: "encrypted-private",
    subject: "mailto:admin@example.com",
    enabled: true,
    timeoutMs: 10_000,
    updatedAt: new Date("2026-10-10T00:00:00.000Z"),
  }
  const endpoint = {
    endpoint: "https://push.example.test/subscription",
    keys: { p256dh: "p256dh", auth: "auth" },
  }

  function setup() {
    const tx = {
      notificationPushSettings: { findUnique: jest.fn().mockResolvedValue(settings) },
      notificationPushEndpoint: {
        upsert: jest.fn().mockResolvedValue({ id: "endpoint-1", active: true }),
      },
    }
    const prisma = {
      withTenantTransaction: jest.fn((_tenant, operation) => operation(tx)),
    }
    const secrets = { encryptSecret: jest.fn((value: string) => `encrypted:${value}`) }
    const providers = { list: jest.fn(() => ["WEB_PUSH"]) }
    const service = new PushSettingsService(
      prisma as never,
      secrets as never,
      providers as never,
      {} as never,
    )
    return { service, tx }
  }

  it("upserts duplicate browser endpoints within the authenticated tenant", async () => {
    const { service, tx } = setup()

    await service.register(context, endpoint, "browser")
    await service.register(context, endpoint, "browser")

    expect(tx.notificationPushEndpoint.upsert).toHaveBeenCalledTimes(2)
    const first = tx.notificationPushEndpoint.upsert.mock.calls[0][0]
    const second = tx.notificationPushEndpoint.upsert.mock.calls[1][0]
    expect(first.where).toEqual(second.where)
    expect(first.create).toMatchObject({ organizationId: "org-a", userId: "user-a" })
    expect(first.update).toMatchObject({ userId: "user-a", active: true })
  })
})
