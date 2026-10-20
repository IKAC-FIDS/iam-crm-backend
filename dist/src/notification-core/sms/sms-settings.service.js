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
exports.SmsSettingsService = void 0;
const common_1 = require("@nestjs/common");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const sso_secret_service_1 = require("../../auth/sso/sso-secret.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const sms_provider_registry_1 = require("./sms-provider.registry");
const sms_recipient_resolver_service_1 = require("./sms-recipient-resolver.service");
let SmsSettingsService = class SmsSettingsService {
    constructor(prisma, secrets, providers, audit, contacts) {
        this.prisma = prisma;
        this.secrets = secrets;
        this.providers = providers;
        this.audit = audit;
        this.contacts = contacts;
    }
    async get(organizationId) {
        const row = await this.prisma.notificationSmsSettings.findUnique({ where: { organizationId } });
        return this.publicSettings(row);
    }
    async update(organizationId, actorId, dto) {
        const current = await this.prisma.notificationSmsSettings.findUnique({ where: { organizationId }, select: { apiKeyEnc: true } });
        const apiKeyEnc = dto.clearApiKey ? null : dto.apiKey?.trim() ? this.secrets.encryptSecret(dto.apiKey.trim()) : current?.apiKeyEnc ?? null;
        const config = { apiUrl: dto.apiUrl.trim(), apiKey: apiKeyEnc ? this.secrets.decryptSecret(apiKeyEnc) : "", senderNumber: dto.senderNumber.trim(), timeoutMs: dto.timeoutMs ?? 10000 };
        const provider = this.providers.get(dto.provider.trim());
        if (dto.enabled)
            provider.validateConfig(config);
        const row = await this.prisma.notificationSmsSettings.upsert({
            where: { organizationId },
            create: { organizationId, provider: provider.code, apiUrl: config.apiUrl, apiKeyEnc, senderNumber: config.senderNumber, enabled: dto.enabled, timeoutMs: config.timeoutMs },
            update: { provider: provider.code, apiUrl: config.apiUrl, apiKeyEnc, senderNumber: config.senderNumber, enabled: dto.enabled, timeoutMs: config.timeoutMs },
        });
        await this.audit.record({ actorId, organizationId, entityType: "notification-sms-settings", entityId: row.id, action: "notification.sms_settings_updated", metadata: { provider: row.provider, apiUrl: row.apiUrl, senderNumber: row.senderNumber, enabled: row.enabled, apiKeyChanged: Boolean(dto.apiKey || dto.clearApiKey) } });
        return this.publicSettings(row);
    }
    async configured(organizationId) {
        const row = await this.prisma.notificationSmsSettings.findUnique({ where: { organizationId } });
        if (!row?.enabled)
            throw new common_1.BadRequestException("سرویس پیامک فعال نیست");
        if (!row.apiKeyEnc)
            throw new common_1.BadRequestException("کلید API پیامک تنظیم نشده است");
        const provider = this.providers.get(row.provider);
        const config = { apiUrl: row.apiUrl, apiKey: this.secrets.decryptSecret(row.apiKeyEnc), senderNumber: row.senderNumber, timeoutMs: row.timeoutMs };
        provider.validateConfig(config);
        return { row, provider, config };
    }
    async test(organizationId, actorId, dto) {
        const destination = this.contacts.normalize(dto.recipient);
        if (!destination)
            throw new common_1.BadRequestException("شماره گیرنده پیامک معتبر نیست");
        const { provider, config } = await this.configured(organizationId);
        const result = await provider.send(config, { to: destination, message: dto.message?.trim() || "پیامک آزمایشی سامانه CRM", sender: config.senderNumber, idempotencyKey: `sms-test:${organizationId}:${Date.now()}` });
        await this.audit.record({ actorId, organizationId, entityType: "notification-sms-settings", action: "notification.sms_test_attempted", metadata: { provider: provider.code, destination: this.contacts.mask(destination), success: result.success, providerMessageId: result.providerMessageId, errorCode: result.errorCode } });
        return result;
    }
    async status(organizationId) {
        const row = await this.prisma.notificationSmsSettings.findUnique({ where: { organizationId } });
        if (!row)
            return { channel: "SMS", available: true, configured: false, enabled: false, usable: false, provider: null, configurationPath: "/admin/notifications?tab=channels" };
        const configured = Boolean(row.provider && row.apiUrl && row.apiKeyEnc && row.senderNumber);
        return { channel: "SMS", available: true, configured, enabled: row.enabled, usable: configured && row.enabled, provider: row.provider, configurationPath: "/admin/notifications?tab=channels" };
    }
    providersList() { return this.providers.list(); }
    publicSettings(row) {
        return row ? { provider: row.provider, apiUrl: row.apiUrl, senderNumber: row.senderNumber, enabled: row.enabled, timeoutMs: row.timeoutMs, apiKeyConfigured: Boolean(row.apiKeyEnc), configured: Boolean(row.provider && row.apiUrl && row.apiKeyEnc && row.senderNumber), usable: Boolean(row.enabled && row.provider && row.apiUrl && row.apiKeyEnc && row.senderNumber), lastUpdatedAt: row.updatedAt, providers: this.providers.list() } : { provider: this.providers.list()[0] ?? "", apiUrl: "", senderNumber: "", enabled: false, timeoutMs: 10000, apiKeyConfigured: false, configured: false, usable: false, lastUpdatedAt: null, providers: this.providers.list() };
    }
};
exports.SmsSettingsService = SmsSettingsService;
exports.SmsSettingsService = SmsSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sso_secret_service_1.SsoSecretService,
        sms_provider_registry_1.SmsProviderRegistry,
        audit_log_service_1.AuditLogService,
        sms_recipient_resolver_service_1.SmsRecipientResolver])
], SmsSettingsService);
//# sourceMappingURL=sms-settings.service.js.map