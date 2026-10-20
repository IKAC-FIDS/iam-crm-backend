"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUOTA_RESERVATION_TTL_MS = exports.QUOTA_THRESHOLDS = exports.QUOTA_METRICS = exports.EVENT_METRICS = exports.INVENTORY_METRICS = void 0;
const client_1 = require("@prisma/client");
exports.INVENTORY_METRICS = new Set([
    client_1.QuotaMetric.ACTIVE_USERS,
    client_1.QuotaMetric.COMPANIES,
    client_1.QuotaMetric.OPPORTUNITIES,
    client_1.QuotaMetric.FILES,
    client_1.QuotaMetric.STORAGE_BYTES,
]);
exports.EVENT_METRICS = new Set([
    client_1.QuotaMetric.API_CALLS,
    client_1.QuotaMetric.WORKFLOW_RUNS,
    client_1.QuotaMetric.WEBHOOK_DELIVERIES,
    client_1.QuotaMetric.EMAIL_SENDS,
    client_1.QuotaMetric.AI_REQUESTS,
]);
exports.QUOTA_METRICS = Object.values(client_1.QuotaMetric);
exports.QUOTA_THRESHOLDS = [80, 90];
exports.QUOTA_RESERVATION_TTL_MS = 15 * 60 * 1000;
//# sourceMappingURL=quota.constants.js.map