import { Injectable } from '@nestjs/common';
import { NotificationEntityType, NotificationPriority, NotificationType } from '@prisma/client';

const routes: Record<string, string> = { TASK: 'tasks', MEETING: 'meetings', OPPORTUNITY: 'opportunities' };

@Injectable()
export class NotificationActionUrlResolver {
  resolve(event: { eventName: string; aggregateType: string; aggregateId: string }): string | null {
    const route = routes[event.aggregateType];
    if (!route || !event.eventName.startsWith(`${event.aggregateType}.`) || !/^[a-zA-Z0-9_-]+$/.test(event.aggregateId)) return null;
    return `/${route}/${event.aggregateId}`;
  }
}

@Injectable()
export class InAppNotificationMetadataMapper {
  map(event: { eventName: string; aggregateType: string; aggregateId: string }) {
    const type = event.eventName === 'TASK.COMPLETED' ? NotificationType.TASK_COMPLETED
      : ['TASK.ASSIGNED', 'TASK.REASSIGNED'].includes(event.eventName) ? NotificationType.TASK_ASSIGNED
      : NotificationType.SYSTEM;
    const entityType = event.aggregateType === 'TASK' ? NotificationEntityType.TASK
      : event.aggregateType === 'MEETING' ? NotificationEntityType.MEETING
      : event.aggregateType === 'OPPORTUNITY' ? NotificationEntityType.OPPORTUNITY : null;
    return { type, entityType, entityId: event.aggregateId, priority: NotificationPriority.NORMAL };
  }
}
