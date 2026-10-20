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
exports.NotificationDigestRendererService = void 0;
const common_1 = require("@nestjs/common");
const notification_template_engine_service_1 = require("../notification-template-engine.service");
let NotificationDigestRendererService = class NotificationDigestRendererService {
    constructor(templates) {
        this.templates = templates;
    }
    async render(bucketId, recipientUserId, db) {
        const bucket = await db.notificationDigestBucket.findUniqueOrThrow({
            where: { id: bucketId },
            include: { policy: { select: { name: true, subjectTemplate: true, introText: true } }, items: { orderBy: { createdAt: "asc" }, include: { bucket: false } } },
        });
        const deliveries = await db.notificationDelivery.findMany({
            where: { id: { in: bucket.items.map(item => item.deliveryId) } },
            include: { event: true, template: true }, orderBy: { createdAt: "asc" },
        });
        const rendered = [];
        for (const delivery of deliveries) {
            if (!delivery.template)
                continue;
            const item = await this.templates.renderStoredTemplate(delivery.event, recipientUserId, delivery.template, db);
            rendered.push({ subject: item.subject?.trim() || delivery.event.eventName, body: item.body.trim() });
        }
        return {
            subject: `${bucket.policy.subjectTemplate} — ${rendered.length.toLocaleString("fa-IR")} اعلان`,
            body: `${bucket.policy.introText}\n\n${rendered.map((item, index) => `${index + 1}. ${item.subject}\n${item.body}`).join("\n\n──────────\n\n")}`,
        };
    }
};
exports.NotificationDigestRendererService = NotificationDigestRendererService;
exports.NotificationDigestRendererService = NotificationDigestRendererService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notification_template_engine_service_1.NotificationTemplateEngineService])
], NotificationDigestRendererService);
//# sourceMappingURL=notification-digest-renderer.service.js.map