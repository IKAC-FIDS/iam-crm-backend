import { NotificationCoreService } from '../src/notification-core/notification-core.service';
import { NotificationRuleEngineService } from '../src/notification-core/notification-rule-engine.service';

describe('Notification Core automatic inbox dispatch', () => {
  it('keeps channel deliveries separate and re-evaluates without duplicates', async () => {
    const keys = new Set<string>();
    const db = {
      notificationRule: { findMany: jest.fn().mockResolvedValue([{ id: 'rule-1', recipientRules: [{ id: 'recipient-rule-1', type: 'USER', targetId: 'user-1', channels: ['EMAIL', 'SMS', 'IN_APP'] }] }]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'user-1' }]) },
      notificationDelivery: { createMany: jest.fn(async ({ data, skipDuplicates }) => {
        expect(skipDuplicates).toBe(true);
        if (keys.has(data.deduplicationKey)) return { count: 0 };
        keys.add(data.deduplicationKey); return { count: 1 };
      }) },
    };
    const templates = { renderDelivery: jest.fn().mockResolvedValue({ template: { id: 'template-1' } }) };
    const engine = new NotificationRuleEngineService(db as any, templates as any);
    const event = { id: 'event-1', organizationId: 'org-a', eventName: 'TASK.ASSIGNED' } as any;
    expect(await engine.evaluateEvent(event)).toMatchObject({ created: 3, duplicate: 0 });
    expect(await engine.evaluateEvent(event)).toMatchObject({ created: 0, duplicate: 3 });
    expect(keys.size).toBe(3);
  });
  it('evaluates the published event in tenant scope and routes all implemented channels through the shared dispatcher', async () => {
    const event = { id: 'event-1', organizationId: 'org-a', eventName: 'TASK.ASSIGNED' };
    const tx = {
      notificationEvent: { create: jest.fn().mockResolvedValue(event) },
      notificationDelivery: { findMany: jest.fn().mockResolvedValue([{ id: 'delivery-1' }]) },
    };
    const prisma = { withTenantTransaction: jest.fn(async (_context, callback) => callback(tx)) };
    const rules = { evaluateEvent: jest.fn().mockResolvedValue({ created: 3 }) };
    const dispatcher = { dispatch: jest.fn().mockResolvedValue({ sent: true, status: 'DELIVERED' }) };
    const core = new NotificationCoreService(prisma as any, rules as any, dispatcher as any);
    await core.publishAndEvaluate({ organizationId: 'org-a', eventName: 'TASK.ASSIGNED', aggregateType: 'TASK', aggregateId: 'task-1' });
    expect(rules.evaluateEvent).toHaveBeenCalledWith(event, tx);
    expect(tx.notificationDelivery.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ channel: { in: ['IN_APP', 'EMAIL', 'SMS'] }, event: { organizationId: 'org-a' } }) }));
    expect(dispatcher.dispatch).toHaveBeenCalledWith('delivery-1', 'org-a');
    expect(prisma.withTenantTransaction).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-a', platformAdmin: false }), expect.any(Function));
  });
});
