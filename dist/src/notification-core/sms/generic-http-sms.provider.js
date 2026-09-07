"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericHttpSmsProvider = void 0;
const common_1 = require("@nestjs/common");
let GenericHttpSmsProvider = class GenericHttpSmsProvider {
    constructor() {
        this.code = "GENERIC_HTTP_JSON";
    }
    validateConfig(config) {
        let url;
        try {
            url = new URL(config.apiUrl);
        }
        catch {
            throw new common_1.BadRequestException("آدرس API پیامک معتبر نیست");
        }
        if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
            throw new common_1.BadRequestException("آدرس API پیامک باید HTTPS باشد");
        }
        if (url.username || url.password)
            throw new common_1.BadRequestException("قرار دادن اطلاعات ورود در آدرس API مجاز نیست");
        if (!config.apiKey.trim())
            throw new common_1.BadRequestException("کلید API پیامک تنظیم نشده است");
        if (!config.senderNumber.trim())
            throw new common_1.BadRequestException("شماره فرستنده پیامک تنظیم نشده است");
        if (config.timeoutMs < 1000 || config.timeoutMs > 60000)
            throw new common_1.BadRequestException("مهلت اتصال پیامک نامعتبر است");
    }
    async send(config, input) {
        this.validateConfig(config);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
        try {
            const response = await fetch(config.apiUrl, {
                method: "POST",
                headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
                body: JSON.stringify({ to: input.to, message: input.message, sender: input.sender ?? config.senderNumber, idempotencyKey: input.idempotencyKey }),
                signal: controller.signal,
            });
            const payload = await this.safeJson(response);
            if (!response.ok)
                return { success: false, errorCode: `HTTP_${response.status}`, errorMessage: `SMS provider rejected the request (${response.status})` };
            if (payload.success !== true) {
                return { success: false, errorCode: this.text(payload.errorCode) ?? "PROVIDER_REJECTED", errorMessage: this.text(payload.errorMessage) ?? "SMS provider rejected the request" };
            }
            const messageId = payload.messageId;
            if (typeof messageId !== "string" && typeof messageId !== "number") {
                return { success: false, errorCode: "MALFORMED_PROVIDER_RESPONSE", errorMessage: "SMS provider response did not include messageId" };
            }
            return { success: true, providerMessageId: String(messageId), providerStatus: this.text(payload.status), rawMetadata: { status: this.text(payload.status) } };
        }
        catch (error) {
            const timedOut = error instanceof Error && error.name === "AbortError";
            return { success: false, errorCode: timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_NETWORK_ERROR", errorMessage: timedOut ? "SMS provider request timed out" : "SMS provider network request failed" };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async safeJson(response) {
        try {
            const value = await response.json();
            return value && typeof value === "object" && !Array.isArray(value) ? value : {};
        }
        catch {
            return {};
        }
    }
    text(value) { return typeof value === "string" ? value.slice(0, 500) : null; }
};
exports.GenericHttpSmsProvider = GenericHttpSmsProvider;
exports.GenericHttpSmsProvider = GenericHttpSmsProvider = __decorate([
    (0, common_1.Injectable)()
], GenericHttpSmsProvider);
//# sourceMappingURL=generic-http-sms.provider.js.map