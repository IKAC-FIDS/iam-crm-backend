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
exports.PushSettingsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const sso_secret_service_1 = require("../../auth/sso/sso-secret.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const push_provider_registry_1 = require("./push-provider.registry");
let PushSettingsService = class PushSettingsService {
    constructor(prisma, secrets, providers, audit) {
        this.prisma = prisma;
        this.secrets = secrets;
        this.providers = providers;
        this.audit = audit;
    }
    async get(context) {
        const row = await this.prisma.withTenantTransaction(context, tx => tx.notificationPushSettings.findUnique({ where: { organizationId: context.organizationId } }));
        return this.publicSettings(row);
    }
    async update(context, dto) {
        const current = await this.prisma.withTenantTransaction(context, tx => tx.notificationPushSettings.findUnique({ where: { organizationId: context.organizationId }, select: { privateKeyEnc: true } }));
        const privateKeyEnc = dto.clearPrivateKey ? null : dto.privateKey?.trim() ? this.secrets.encryptSecret(dto.privateKey.trim()) : current?.privateKeyEnc ?? null;
        const provider = this.providers.get(dto.provider);
        void provider;
        const publicKey = dto.publicKey?.trim() || null;
        const subject = dto.subject?.trim() || null;
        if (dto.enabled && (!publicKey || !privateKeyEnc || !subject))
            throw new common_1.BadRequestException("کلید عمومی، کلید خصوصی و Subject برای فعال‌سازی پوش الزامی‌اند");
        const row = await this.prisma.withTenantTransaction(context, tx => tx.notificationPushSettings.upsert({
            where: { organizationId: context.organizationId },
            create: { organizationId: context.organizationId, provider: dto.provider, publicKey, privateKeyEnc, subject, enabled: dto.enabled, timeoutMs: dto.timeoutMs ?? 10000 },
            update: { provider: dto.provider, publicKey, privateKeyEnc, subject, enabled: dto.enabled, timeoutMs: dto.timeoutMs ?? 10000 },
        }));
        await this.audit.record({ organizationId: context.organizationId, actorId: context.userId, entityType: "notification-push-settings", entityId: row.id, action: "notification.push_settings_updated", metadata: { provider: row.provider, enabled: row.enabled, publicKeyChanged: dto.publicKey !== undefined, privateKeyChanged: Boolean(dto.privateKey || dto.clearPrivateKey) } });
        return this.publicSettings(row);
    }
    async configured(context) {
        const row = await this.prisma.withTenantTransaction(context, tx => tx.notificationPushSettings.findUnique({ where: { organizationId: context.organizationId } }));
        if (!row?.enabled || !row.publicKey || !row.privateKeyEnc || !row.subject)
            throw new common_1.BadRequestException("کانال پوش فعال یا کامل نیست");
        const config = { publicKey: row.publicKey, privateKey: this.secrets.decryptSecret(row.privateKeyEnc), subject: row.subject, timeoutMs: row.timeoutMs };
        return { row, provider: this.providers.get(row.provider), config };
    }
    async status(context) {
        const settings = await this.get(context);
        return { channel: "PUSH", available: true, configured: settings.configured, enabled: settings.enabled, usable: settings.usable, provider: settings.provider || null, configurationPath: "/admin/notifications?tab=channels" };
    }
    async publicConfig(context) {
        const settings = await this.get(context);
        return { provider: settings.provider, enabled: settings.enabled, configured: settings.configured, publicKey: settings.usable ? settings.publicKey : null };
    }
    async register(context, dto, userAgent) {
        const settings = await this.get(context);
        if (!settings.usable || settings.provider !== "WEB_PUSH")
            throw new common_1.BadRequestException("کانال Web Push سازمان فعال نیست");
        const subscription = { endpoint: dto.endpoint, expirationTime: dto.expirationTime ?? null, keys: dto.keys };
        const externalEndpointId = this.endpointHash(dto.endpoint);
        return this.prisma.withTenantTransaction(context, tx => tx.notificationPushEndpoint.upsert({
            where: { organizationId_provider_externalEndpointId: { organizationId: context.organizationId, provider: "WEB_PUSH", externalEndpointId } },
            create: { organizationId: context.organizationId, userId: context.userId, provider: "WEB_PUSH", endpointType: "WEB", externalEndpointId, endpointEnc: this.secrets.encryptSecret(JSON.stringify(subscription)), metadata: { label: dto.label?.trim() || null, userAgent: userAgent?.slice(0, 500) || null }, active: true },
            update: { userId: context.userId, endpointEnc: this.secrets.encryptSecret(JSON.stringify(subscription)), metadata: { label: dto.label?.trim() || null, userAgent: userAgent?.slice(0, 500) || null }, active: true, lastSeenAt: new Date() },
            select: { id: true, provider: true, endpointType: true, active: true, lastSeenAt: true, createdAt: true },
        }));
    }
    listOwn(context) { return this.prisma.withTenantTransaction(context, tx => tx.notificationPushEndpoint.findMany({ where: { organizationId: context.organizationId, userId: context.userId, active: true }, select: { id: true, provider: true, endpointType: true, metadata: true, active: true, lastSeenAt: true, createdAt: true }, orderBy: { lastSeenAt: "desc" } })); }
    async removeOwn(context, id) {
        const result = await this.prisma.withTenantTransaction(context, tx => tx.notificationPushEndpoint.updateMany({ where: { id, organizationId: context.organizationId, userId: context.userId }, data: { active: false } }));
        if (!result.count)
            throw new common_1.BadRequestException("اشتراک پوش متعلق به کاربر جاری یافت نشد");
        return { disabled: true };
    }
    endpoints(context, userId, tx) { return tx.notificationPushEndpoint.findMany({ where: { organizationId: context.organizationId, userId, active: true }, orderBy: { lastSeenAt: "desc" } }); }
    decodeEndpoint(value) { return JSON.parse(this.secrets.decryptSecret(value)); }
    deactivate(context, ids, tx) { return tx.notificationPushEndpoint.updateMany({ where: { id: { in: ids }, organizationId: context.organizationId }, data: { active: false } }); }
    async test(context, dto) {
        const { provider, config } = await this.configured(context);
        const endpoints = await this.prisma.withTenantTransaction(context, tx => this.endpoints(context, dto.recipientUserId, tx));
        const results = await Promise.all(endpoints.map(endpoint => provider.send({ recipientUserId: dto.recipientUserId, endpointId: endpoint.id, subscription: this.decodeEndpoint(endpoint.endpointEnc), title: dto.title?.trim() || "اعلان آزمایشی CRM", body: dto.body?.trim() || "تنظیمات اعلان پوش با موفقیت بررسی شد.", actionUrl: "/notifications", idempotencyKey: `push-test:${context.organizationId}:${endpoint.id}:${Date.now()}` }, config)));
        const invalid = endpoints.filter((_, index) => results[index]?.invalidEndpoint).map(item => item.id);
        if (invalid.length)
            await this.prisma.withTenantTransaction(context, tx => this.deactivate(context, invalid, tx));
        return { attempted: endpoints.length, successful: results.filter(item => item.success).length, failed: results.filter(item => !item.success).length, results: results.map((item, index) => ({ endpointId: endpoints[index]?.id, success: item.success, providerStatus: item.providerStatus, errorCode: item.errorCode, errorMessage: item.errorMessage })) };
    }
    endpointHash(value) { return (0, crypto_1.createHash)("sha256").update(value).digest("hex"); }
    publicSettings(row) {
        const providers = this.providers.list();
        if (!row)
            return { provider: providers[0] ?? "WEB_PUSH", publicKey: "", subject: "mailto:admin@example.com", enabled: false, timeoutMs: 10000, privateKeyConfigured: false, configured: false, usable: false, lastUpdatedAt: null, providers };
        const configured = Boolean(row.provider && row.publicKey && row.privateKeyEnc && row.subject);
        return { provider: row.provider, publicKey: row.publicKey || "", subject: row.subject || "", enabled: row.enabled, timeoutMs: row.timeoutMs, privateKeyConfigured: Boolean(row.privateKeyEnc), configured, usable: configured && row.enabled, lastUpdatedAt: row.updatedAt, providers };
    }
};
exports.PushSettingsService = PushSettingsService;
exports.PushSettingsService = PushSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, sso_secret_service_1.SsoSecretService, push_provider_registry_1.PushProviderRegistry, audit_log_service_1.AuditLogService])
], PushSettingsService);
//# sourceMappingURL=push-settings.service.js.map