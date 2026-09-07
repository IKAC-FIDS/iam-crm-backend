"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppNotificationMetadataMapper = exports.NotificationActionUrlResolver = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const routes = { TASK: 'tasks', MEETING: 'meetings', OPPORTUNITY: 'opportunities' };
let NotificationActionUrlResolver = class NotificationActionUrlResolver {
    resolve(event) {
        const route = routes[event.aggregateType];
        if (!route || !event.eventName.startsWith(`${event.aggregateType}.`) || !/^[a-zA-Z0-9_-]+$/.test(event.aggregateId))
            return null;
        return `/${route}/${event.aggregateId}`;
    }
};
exports.NotificationActionUrlResolver = NotificationActionUrlResolver;
exports.NotificationActionUrlResolver = NotificationActionUrlResolver = __decorate([
    (0, common_1.Injectable)()
], NotificationActionUrlResolver);
let InAppNotificationMetadataMapper = class InAppNotificationMetadataMapper {
    map(event) {
        const type = event.eventName === 'TASK.COMPLETED' ? client_1.NotificationType.TASK_COMPLETED
            : ['TASK.ASSIGNED', 'TASK.REASSIGNED'].includes(event.eventName) ? client_1.NotificationType.TASK_ASSIGNED
                : client_1.NotificationType.SYSTEM;
        const entityType = event.aggregateType === 'TASK' ? client_1.NotificationEntityType.TASK
            : event.aggregateType === 'MEETING' ? client_1.NotificationEntityType.MEETING
                : event.aggregateType === 'OPPORTUNITY' ? client_1.NotificationEntityType.OPPORTUNITY : null;
        return { type, entityType, entityId: event.aggregateId, priority: client_1.NotificationPriority.NORMAL };
    }
};
exports.InAppNotificationMetadataMapper = InAppNotificationMetadataMapper;
exports.InAppNotificationMetadataMapper = InAppNotificationMetadataMapper = __decorate([
    (0, common_1.Injectable)()
], InAppNotificationMetadataMapper);
//# sourceMappingURL=notification-action-url.resolver.js.map