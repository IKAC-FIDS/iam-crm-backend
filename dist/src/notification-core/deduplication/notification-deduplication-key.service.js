"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeduplicationKeyService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
let NotificationDeduplicationKeyService = class NotificationDeduplicationKeyService {
    constructor() {
        this.version = "v1";
    }
    eventOccurrence(event) {
        const identity = event.idempotencyKey?.trim();
        if (!identity)
            throw new common_1.BadRequestException("Notification event occurrence identity is required");
        return identity;
    }
    build(input) {
        const organizationId = this.required(input.organizationId, "organizationId");
        const eventOccurrenceKey = this.required(input.eventOccurrenceKey, "eventOccurrenceKey");
        const recipientUserId = this.required(input.recipientUserId, "recipientUserId");
        const channel = this.required(String(input.channel).toUpperCase(), "channel");
        const canonical = JSON.stringify([this.version, organizationId, eventOccurrenceKey, recipientUserId, channel]);
        return (0, node_crypto_1.createHash)("sha256").update(canonical, "utf8").digest("hex");
    }
    required(value, field) {
        const normalized = value?.trim();
        if (!normalized)
            throw new common_1.BadRequestException(`Notification delivery identity ${field} is required`);
        return normalized;
    }
};
exports.NotificationDeduplicationKeyService = NotificationDeduplicationKeyService;
exports.NotificationDeduplicationKeyService = NotificationDeduplicationKeyService = __decorate([
    (0, common_1.Injectable)()
], NotificationDeduplicationKeyService);
//# sourceMappingURL=notification-deduplication-key.service.js.map