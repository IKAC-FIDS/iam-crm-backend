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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer_1 = require("nodemailer");
const prisma_service_1 = require("../prisma/prisma.service");
const sso_secret_service_1 = require("../auth/sso/sso-secret.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
let EmailService = class EmailService {
    constructor(prisma, secrets, audit) {
        this.prisma = prisma;
        this.secrets = secrets;
        this.audit = audit;
    }
    async getSettings(organizationId) {
        const settings = await this.prisma.organizationSettings.findUnique({ where: { organizationId } });
        if (!settings)
            throw new common_1.NotFoundException('Organization settings not found');
        return this.publicSettings(settings);
    }
    async updateSettings(organizationId, actorId, dto) {
        if (dto.enabled && !dto.password && !(await this.hasPassword(organizationId)))
            throw new common_1.BadRequestException('رمز عبور SMTP الزامی است');
        const settings = await this.prisma.organizationSettings.upsert({
            where: { organizationId },
            create: { organizationId, smtpEnabled: dto.enabled, smtpHost: dto.host.trim(), smtpPort: dto.port, smtpSecure: dto.secure, smtpUsername: dto.username?.trim() || null, smtpPasswordEnc: dto.password ? this.secrets.encryptSecret(dto.password) : null, smtpFromEmail: dto.fromEmail.trim(), smtpFromName: dto.fromName?.trim() || null, smtpReplyTo: dto.replyTo?.trim() || null },
            update: { smtpEnabled: dto.enabled, smtpHost: dto.host.trim(), smtpPort: dto.port, smtpSecure: dto.secure, smtpUsername: dto.username?.trim() || null, ...(dto.password ? { smtpPasswordEnc: this.secrets.encryptSecret(dto.password) } : {}), smtpFromEmail: dto.fromEmail.trim(), smtpFromName: dto.fromName?.trim() || null, smtpReplyTo: dto.replyTo?.trim() || null },
        });
        await this.audit.record({ actorId, organizationId, entityType: 'organization-settings', entityId: settings.id, action: 'email.settings_updated', metadata: { host: settings.smtpHost, port: settings.smtpPort, enabled: settings.smtpEnabled } });
        return this.publicSettings(settings);
    }
    async send(organizationId, message) {
        const settings = await this.assertConfigured(organizationId);
        const transport = (0, nodemailer_1.createTransport)({ host: settings.smtpHost, port: settings.smtpPort, secure: settings.smtpSecure, auth: settings.smtpUsername ? { user: settings.smtpUsername, pass: settings.smtpPasswordEnc ? this.secrets.decryptSecret(settings.smtpPasswordEnc) : '' } : undefined });
        return transport.sendMail({ from: settings.smtpFromName ? `"${settings.smtpFromName.replace(/["\r\n]/g, '')}" <${settings.smtpFromEmail}>` : settings.smtpFromEmail, replyTo: settings.smtpReplyTo || undefined, ...message });
    }
    async assertConfigured(organizationId) {
        const settings = await this.prisma.organizationSettings.findUnique({ where: { organizationId } });
        if (!settings?.smtpEnabled || !settings.smtpHost || !settings.smtpPort || !settings.smtpFromEmail)
            throw new common_1.BadRequestException('سرویس ایمیل فعال یا کامل نیست');
        return {
            ...settings,
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpFromEmail: settings.smtpFromEmail,
        };
    }
    async sendTest(organizationId, actorId, to) {
        const result = await this.send(organizationId, { to, subject: 'آزمایش سرویس ایمیل CRM', text: 'تنظیمات سرویس ایمیل با موفقیت بررسی شد.' });
        await this.audit.record({ actorId, organizationId, entityType: 'organization-settings', action: 'email.test_sent', metadata: { to, messageId: result.messageId } });
        return { success: true, messageId: result.messageId };
    }
    async hasPassword(organizationId) { const row = await this.prisma.organizationSettings.findUnique({ where: { organizationId }, select: { smtpPasswordEnc: true } }); return Boolean(row?.smtpPasswordEnc); }
    publicSettings(settings) { return { enabled: settings.smtpEnabled, host: settings.smtpHost || '', port: settings.smtpPort ?? 465, secure: settings.smtpSecure, username: settings.smtpUsername || '', hasPassword: Boolean(settings.smtpPasswordEnc), fromEmail: settings.smtpFromEmail || '', fromName: settings.smtpFromName || '', replyTo: settings.smtpReplyTo || '' }; }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, sso_secret_service_1.SsoSecretService, audit_log_service_1.AuditLogService])
], EmailService);
//# sourceMappingURL=email.service.js.map