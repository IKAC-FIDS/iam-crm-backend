"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPushProvider = void 0;
const common_1 = require("@nestjs/common");
const webpush = __importStar(require("web-push"));
let WebPushProvider = class WebPushProvider {
    constructor() {
        this.code = "WEB_PUSH";
    }
    async send(input, config) {
        try {
            const response = await webpush.sendNotification(input.subscription, JSON.stringify({ title: input.title, body: input.body, actionUrl: input.actionUrl ?? null, icon: input.icon ?? null, badge: input.badge ?? null, data: input.data ?? {}, idempotencyKey: input.idempotencyKey }), { vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey }, TTL: 300, timeout: config.timeoutMs });
            return { success: true, providerMessageId: response.headers?.location ?? null, providerStatus: String(response.statusCode), rawMetadata: { statusCode: response.statusCode } };
        }
        catch (error) {
            const candidate = error;
            const status = candidate.statusCode;
            const invalidEndpoint = status === 404 || status === 410;
            const timedOut = candidate.name === "AbortError" || candidate.name === "TimeoutError";
            return {
                success: false,
                invalidEndpoint,
                providerStatus: status ? String(status) : null,
                errorCode: invalidEndpoint ? "INVALID_PUSH_ENDPOINT" : timedOut ? "PROVIDER_TIMEOUT" : status === 401 || status === 403 ? "PROVIDER_AUTH_FAILED" : status ? `HTTP_${status}` : "PROVIDER_NETWORK_ERROR",
                errorMessage: invalidEndpoint ? "اشتراک پوش منقضی یا نامعتبر است" : timedOut ? "مهلت اتصال به ارائه‌دهنده پوش پایان یافت" : "ارسال اعلان پوش ناموفق بود",
            };
        }
    }
};
exports.WebPushProvider = WebPushProvider;
exports.WebPushProvider = WebPushProvider = __decorate([
    (0, common_1.Injectable)()
], WebPushProvider);
//# sourceMappingURL=web-push.provider.js.map