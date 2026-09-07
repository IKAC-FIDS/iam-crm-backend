"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryDispatcher = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const sms_notification_channel_handler_1 = require("./sms/sms-notification-channel.handler");
const in_app_notification_channel_handler_1 = require("./in-app/in-app-notification-channel.handler");
const notification_tenant_context_1 = require("./in-app/notification-tenant-context");
let NotificationDeliveryDispatcher = class NotificationDeliveryDispatcher {
    constructor(prisma, sms, inApp) {
        this.prisma = prisma;
        this.handlers = new Map([[sms.channel, sms], [inApp.channel, inApp]]);
    }
    async dispatch(deliveryId, organizationId) {
        const delivery = await this.prisma.withTenantTransaction((0, notification_tenant_context_1.notificationTenantContext)(organizationId), tx => tx.notificationDelivery.findFirst({ where: { id: deliveryId, event: { organizationId } }, select: { id: true, channel: true } }));
        if (!delivery)
            throw new common_1.BadRequestException("Delivery در سازمان جاری یافت نشد");
        const handler = this.handlers.get(delivery.channel);
        if (!handler)
            throw new common_1.BadRequestException(`کانال ${delivery.channel} هنوز dispatcher ندارد`);
        return handler.dispatch(delivery.id, organizationId);
    }
};
exports.NotificationDeliveryDispatcher = NotificationDeliveryDispatcher;
exports.NotificationDeliveryDispatcher = NotificationDeliveryDispatcher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, sms_notification_channel_handler_1.SmsNotificationChannelHandler, in_app_notification_channel_handler_1.InAppNotificationChannelHandler])
], NotificationDeliveryDispatcher);
//# sourceMappingURL=notification-delivery-dispatcher.service.js.map