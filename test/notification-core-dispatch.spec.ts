import { NotificationCoreService } from '../src/notification-core/notification-core.service';
import { NotificationRuleEngineService } from '../src/notification-core/notification-rule-engine.service';
import { NotificationPolicyEvaluatorService } from '../src/notification-core/policy/notification-policy-evaluator.service';

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
    const engine = new NotificationRuleEngineService(db as any, templates as any, {} as any, { hasConditions: jest.fn().mockReturnValue(false) } as any);
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
    expect(tx.notificationDelivery.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ channel: { in: ['IN_APP', 'EMAIL', 'SMS', 'PUSH'] }, event: { organizationId: 'org-a' } }) }));
    expect(dispatcher.dispatch).toHaveBeenCalledWith('delivery-1', 'org-a');
    expect(prisma.withTenantTransaction).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-a', platformAdmin: false }), expect.any(Function));
  });
  it('continues dispatching independent channels after one delivery fails', async () => {
    const event = { id: 'event-1', organizationId: 'org-a', eventName: 'TASK.ASSIGNED' };
    const tx = {
      notificationEvent: { create: jest.fn().mockResolvedValue(event) },
      notificationDelivery: { findMany: jest.fn().mockResolvedValue([{ id: 'push-delivery' }, { id: 'email-delivery' }]) },
    };
    const prisma = { withTenantTransaction: jest.fn(async (_context, callback) => callback(tx)) };
    const rules = { evaluateEvent: jest.fn().mockResolvedValue({ created: 2 }) };
    const dispatcher = { dispatch: jest.fn().mockRejectedValueOnce(new Error('push failed')).mockResolvedValueOnce({ sent: true, status: 'SENT' }) };
    const core = new NotificationCoreService(prisma as any, rules as any, dispatcher as any);
    await core.publishAndEvaluate({ organizationId: 'org-a', eventName: 'TASK.ASSIGNED', aggregateType: 'TASK', aggregateId: 'task-1' });
    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(1, 'push-delivery', 'org-a');
    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(2, 'email-delivery', 'org-a');
  });
  it('treats a concurrent idempotency conflict as a duplicate and does not evaluate or dispatch twice', async () => {
    const event = { id: 'event-existing', organizationId: 'org-a', eventName: 'MEETING.REMINDER' };
    const tx = {
      notificationEvent: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirstOrThrow: jest.fn().mockResolvedValue(event),
      },
      notificationDelivery: { findMany: jest.fn() },
    };
    const prisma = { withTenantTransaction: jest.fn(async (_context, callback) => callback(tx)) };
    const rules = { evaluateEvent: jest.fn() };
    const dispatcher = { dispatch: jest.fn() };
    const core = new NotificationCoreService(prisma as any, rules as any, dispatcher as any);
    await expect(core.publishAndEvaluate({ organizationId: 'org-a', eventName: 'MEETING.REMINDER', aggregateType: 'MEETING', aggregateId: 'meeting-1', idempotencyKey: 'same-key' })).resolves.toMatchObject({ duplicate: true, evaluation: null });
    expect(rules.evaluateEvent).not.toHaveBeenCalled();
    expect(tx.notificationDelivery.findMany).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });
  it('creates deliveries only for matching conditional rules within the event tenant', async () => {
    const recipient = { id: 'recipient-1', type: 'USER', targetId: 'user-1', channels: ['EMAIL'], enabled: true };
    const db = {
      notificationRule: { findMany: jest.fn().mockResolvedValue([
        { id: 'high-rule', conditions: { version: 1, logic: 'AND', conditions: [{ field: 'task.priority', operator: 'EQ', value: 'HIGH' }] }, recipientRules: [recipient] },
        { id: 'low-rule', conditions: { version: 1, logic: 'AND', conditions: [{ field: 'task.priority', operator: 'EQ', value: 'LOW' }] }, recipientRules: [recipient] },
      ]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'user-1' }]) },
      notificationDelivery: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const templates = { renderDelivery: jest.fn().mockResolvedValue({ template: { id: 'template-1' } }) };
    const contextBuilder = { build: jest.fn().mockResolvedValue({ event: { name: 'TASK.ASSIGNED' }, actor: { id: null, roleId: null, teamId: null }, organization: { id: 'org-a' }, task: { id: 'task-1', title: 'کار', priority: 'HIGH', status: 'TODO', assigneeId: 'user-1', teamId: null, creatorId: null }, meeting: null, opportunity: null }) };
    const engine = new NotificationRuleEngineService(db as any, templates as any, contextBuilder as any, new NotificationPolicyEvaluatorService());
    const result = await engine.evaluateEvent({ id: 'event-1', organizationId: 'org-a', eventName: 'TASK.ASSIGNED', aggregateType: 'TASK', aggregateId: 'task-1' } as any);
    expect(db.notificationRule.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-a', eventName: 'TASK.ASSIGNED', enabled: true } }));
    expect(result).toMatchObject({ rules: 2, matchedRules: 1, created: 1 });
    expect(db.notificationDelivery.createMany).toHaveBeenCalledTimes(1);
  });
  it('evaluates only scheduled rules for the occurrence offset while allowing multiple rules at that offset', async () => {
    const recipient = { id: 'recipient-1', type: 'USER', targetId: 'user-1', channels: ['EMAIL'], enabled: true };
    const db = {
      notificationRule: { findMany: jest.fn().mockResolvedValue([
        { id: 'day-email', schedule: { offsetMinutes: -1440, sourceField: 'meeting.startAt', triggerMode: 'BEFORE' }, recipientRules: [recipient] },
        { id: 'day-in-app', schedule: { offsetMinutes: -1440, sourceField: 'meeting.startAt', triggerMode: 'BEFORE' }, recipientRules: [{ ...recipient, id: 'recipient-2', channels: ['IN_APP'] }] },
        { id: 'hour-sms', schedule: { offsetMinutes: -60, sourceField: 'meeting.startAt', triggerMode: 'BEFORE' }, recipientRules: [{ ...recipient, id: 'recipient-3', channels: ['SMS'] }] },
      ]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'user-1' }]) },
      notificationDelivery: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const templates = { renderDelivery: jest.fn().mockResolvedValue({ template: { id: 'template-1' } }) };
    const engine = new NotificationRuleEngineService(db as any, templates as any, {} as any, { hasConditions: jest.fn().mockReturnValue(false) } as any);
    const event = { id: 'event-1', organizationId: 'org-a', eventName: 'MEETING.REMINDER', aggregateType: 'MEETING', aggregateId: 'meeting-1', payload: { schedule: { offsetMinutes: -1440 } } } as any;
    expect(await engine.evaluateEvent(event)).toMatchObject({ rules: 3, matchedRules: 2, created: 2 });
    expect(db.notificationDelivery.createMany).toHaveBeenCalledTimes(2);
  });
});
