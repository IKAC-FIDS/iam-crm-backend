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
exports.OrganizationConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const organization_domain_normalizer_1 = require("./organization-domain-normalizer");
const organization_domain_verification_service_1 = require("./organization-domain-verification.service");
const DEFAULTS = {
    timezone: "Asia/Tehran",
    locale: "fa-IR",
    calendarSystem: client_1.OrganizationCalendarSystem.PERSIAN,
    dateFormat: client_1.OrganizationDateFormat.YYYY_MM_DD,
    firstDayOfWeek: 6,
    emailSenderDisplayName: null,
    allowPasswordLogin: true,
    allowPasskeyLogin: true,
};
const IMAGE_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "image/x-icon",
    "image/vnd.microsoft.icon",
]);
let OrganizationConfigurationService = class OrganizationConfigurationService {
    constructor(prisma, audit, dns) {
        this.prisma = prisma;
        this.audit = audit;
        this.dns = dns;
    }
    async getSettings(tenant) {
        const organization = await this.prisma.organization.findFirst({
            where: {
                id: tenant.organizationId,
                status: { not: client_1.OrganizationStatus.ARCHIVED },
            },
            select: { timezone: true, locale: true, tenantSettings: true },
        });
        if (!organization)
            throw new common_1.NotFoundException("Organization settings not found");
        return (organization.tenantSettings ?? {
            ...DEFAULTS,
            timezone: organization.timezone || DEFAULTS.timezone,
            locale: organization.locale || DEFAULTS.locale,
        });
    }
    async updateSettings(dto, tenant) {
        const before = await this.getSettings(tenant);
        const data = {
            ...dto,
            ...(dto.timezone && { timezone: dto.timezone.trim() }),
            ...(dto.locale && { locale: this.normalizeLocale(dto.locale) }),
            ...(dto.emailSenderDisplayName !== undefined && {
                emailSenderDisplayName: this.optionalText(dto.emailSenderDisplayName),
            }),
        };
        const after = await this.prisma.$transaction(async (tx) => {
            const settings = await tx.organizationSettings.upsert({
                where: { organizationId: tenant.organizationId },
                create: { organizationId: tenant.organizationId, ...DEFAULTS, ...data },
                update: data,
            });
            if (dto.timezone !== undefined || dto.locale !== undefined)
                await tx.organization.update({
                    where: { id: tenant.organizationId },
                    data: {
                        ...(dto.timezone !== undefined && { timezone: data.timezone }),
                        ...(dto.locale !== undefined && { locale: data.locale }),
                    },
                });
            return settings;
        });
        await this.audit.record({
            actorId: tenant.userId,
            organizationId: tenant.organizationId,
            entityType: "OrganizationSettings",
            entityId: after.id,
            action: "organization.settings.updated",
            before,
            after: this.safeSettings(after),
        });
        return after;
    }
    async getBranding(tenant) {
        const branding = await this.prisma.organizationBranding.findUnique({
            where: { organizationId: tenant.organizationId },
        });
        return this.brandingResponse(branding);
    }
    async updateBranding(dto, tenant) {
        await Promise.all([
            this.validateAsset(dto.logoAttachmentId, tenant.organizationId, 5 * 1024 * 1024),
            this.validateAsset(dto.faviconAttachmentId, tenant.organizationId, 1024 * 1024),
        ]);
        const before = await this.getBranding(tenant);
        const data = {
            ...dto,
            ...(dto.displayTitle !== undefined && {
                displayTitle: this.optionalText(dto.displayTitle),
            }),
            ...this.normalizedColors(dto),
        };
        const branding = await this.prisma.organizationBranding.upsert({
            where: { organizationId: tenant.organizationId },
            create: { organizationId: tenant.organizationId, ...data },
            update: data,
        });
        const after = this.brandingResponse(branding);
        await this.audit.record({
            actorId: tenant.userId,
            organizationId: tenant.organizationId,
            entityType: "OrganizationBranding",
            entityId: branding.id,
            action: "organization.branding.updated",
            before,
            after,
        });
        return after;
    }
    listDomains(tenant) {
        return this.prisma.organizationDomain.findMany({
            where: { organizationId: tenant.organizationId },
            select: this.domainSelect(),
            orderBy: { createdAt: "desc" },
        });
    }
    async getDomain(id, tenant) {
        const domain = await this.prisma.organizationDomain.findFirst({
            where: { id, organizationId: tenant.organizationId },
            select: this.domainSelect(),
        });
        if (!domain)
            throw new common_1.NotFoundException("Organization domain not found");
        return domain;
    }
    async createDomain(dto, tenant) {
        const hostname = (0, organization_domain_normalizer_1.normalizeOrganizationHostname)(dto.hostname);
        const subdomainLabel = dto.type === client_1.OrganizationDomainType.SUBDOMAIN
            ? hostname.split(".")[0]
            : null;
        const token = (0, node_crypto_1.randomBytes)(32).toString("base64url");
        try {
            const domain = await this.prisma.organizationDomain.create({
                data: {
                    organizationId: tenant.organizationId,
                    type: dto.type,
                    hostname,
                    subdomainLabel,
                    verificationTokenHash: this.hash(token),
                },
                select: this.domainSelect(),
            });
            await this.audit.record({
                actorId: tenant.userId,
                organizationId: tenant.organizationId,
                entityType: "OrganizationDomain",
                entityId: domain.id,
                action: "organization.domain.created",
                after: domain,
            });
            return {
                ...domain,
                verification: {
                    method: "DNS_TXT",
                    recordName: `_iam-crm-verification.${hostname}`,
                    recordValue: `iam-crm-verification=${token}`,
                },
            };
        }
        catch (error) {
            this.translateConflict(error);
        }
    }
    async updateDomain(id, dto, tenant) {
        const before = await this.getDomain(id, tenant);
        if (dto.status !== client_1.OrganizationDomainStatus.DISABLED &&
            dto.status !== client_1.OrganizationDomainStatus.PENDING)
            throw new common_1.BadRequestException("Domain status can only be disabled or reset to pending");
        const domain = await this.prisma.organizationDomain.update({
            where: { id },
            data: {
                status: dto.status,
                ...(dto.status === client_1.OrganizationDomainStatus.PENDING && {
                    verifiedAt: null,
                    failureCode: null,
                }),
            },
            select: this.domainSelect(),
        });
        await this.audit.record({
            actorId: tenant.userId,
            organizationId: tenant.organizationId,
            entityType: "OrganizationDomain",
            entityId: id,
            action: dto.status === client_1.OrganizationDomainStatus.DISABLED
                ? "organization.domain.disabled"
                : "organization.domain.updated",
            before,
            after: domain,
        });
        return domain;
    }
    async verifyDomain(id, tenant) {
        const record = await this.prisma.organizationDomain.findFirst({
            where: { id, organizationId: tenant.organizationId },
        });
        if (!record)
            throw new common_1.NotFoundException("Organization domain not found");
        if (record.status === client_1.OrganizationDomainStatus.DISABLED)
            throw new common_1.ConflictException("Disabled domain cannot be verified");
        if (record.status === client_1.OrganizationDomainStatus.VERIFIED)
            return this.getDomain(id, tenant);
        const checkedAt = new Date();
        try {
            const values = await this.dns.readTxt(`_iam-crm-verification.${record.hostname}`);
            const matched = values.some((value) => value.startsWith("iam-crm-verification=") &&
                this.hash(value.slice("iam-crm-verification=".length)) ===
                    record.verificationTokenHash);
            if (!matched)
                throw new common_1.BadRequestException("DNS verification record did not match");
            const domain = await this.prisma.organizationDomain.update({
                where: { id },
                data: {
                    status: client_1.OrganizationDomainStatus.VERIFIED,
                    verifiedAt: checkedAt,
                    lastCheckedAt: checkedAt,
                    failureCode: null,
                },
                select: this.domainSelect(),
            });
            await this.audit.record({
                actorId: tenant.userId,
                organizationId: tenant.organizationId,
                entityType: "OrganizationDomain",
                entityId: id,
                action: "organization.domain.verified",
                after: domain,
            });
            return domain;
        }
        catch (error) {
            await this.prisma.organizationDomain.update({
                where: { id },
                data: {
                    status: client_1.OrganizationDomainStatus.FAILED,
                    lastCheckedAt: checkedAt,
                    failureCode: "DNS_TXT_VERIFICATION_FAILED",
                },
            });
            await this.audit.record({
                actorId: tenant.userId,
                organizationId: tenant.organizationId,
                entityType: "OrganizationDomain",
                entityId: id,
                action: "organization.domain.verification_failed",
                metadata: { failureCode: "DNS_TXT_VERIFICATION_FAILED" },
            });
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException("Domain verification failed");
        }
    }
    async resolveVerifiedHostname(rawHostname) {
        const hostname = (0, organization_domain_normalizer_1.normalizeOrganizationHostname)(rawHostname);
        const domain = await this.prisma.organizationDomain.findFirst({
            where: {
                hostname,
                status: client_1.OrganizationDomainStatus.VERIFIED,
                organization: { status: client_1.OrganizationStatus.ACTIVE },
            },
            select: { organizationId: true, hostname: true, type: true },
        });
        return domain ?? null;
    }
    async validateAsset(id, organizationId, maxBytes) {
        if (id === undefined || id === null)
            return;
        const attachment = await this.prisma.fileAttachment.findFirst({
            where: { id, organizationId, deletedAt: null },
            select: { mimeType: true, sizeBytes: true },
        });
        if (!attachment)
            throw new common_1.NotFoundException("Branding asset not found");
        if (!attachment.mimeType ||
            !IMAGE_TYPES.has(attachment.mimeType) ||
            attachment.sizeBytes === null ||
            attachment.sizeBytes > maxBytes)
            throw new common_1.BadRequestException("Unsupported branding asset");
    }
    brandingResponse(value) {
        if (!value)
            return {
                displayTitle: null,
                primaryColor: null,
                secondaryColor: null,
                accentColor: null,
                logoAttachmentId: null,
                faviconAttachmentId: null,
                logoUrl: null,
                faviconUrl: null,
            };
        return {
            id: value.id,
            displayTitle: value.displayTitle,
            primaryColor: value.primaryColor,
            secondaryColor: value.secondaryColor,
            accentColor: value.accentColor,
            logoAttachmentId: value.logoAttachmentId,
            faviconAttachmentId: value.faviconAttachmentId,
            createdAt: value.createdAt,
            updatedAt: value.updatedAt,
            logoUrl: value.logoAttachmentId
                ? `/api/attachments/${value.logoAttachmentId}/download`
                : null,
            faviconUrl: value.faviconAttachmentId
                ? `/api/attachments/${value.faviconAttachmentId}/download`
                : null,
        };
    }
    normalizedColors(dto) {
        return Object.fromEntries(["primaryColor", "secondaryColor", "accentColor"]
            .filter((key) => key in dto)
            .map((key) => [
            key,
            dto[key]?.toUpperCase() ?? null,
        ]));
    }
    normalizeLocale(value) {
        try {
            return Intl.getCanonicalLocales(value.trim())[0];
        }
        catch {
            throw new common_1.BadRequestException("Invalid locale");
        }
    }
    optionalText(value) {
        return value?.trim() || null;
    }
    hash(value) {
        return (0, node_crypto_1.createHash)("sha256").update(value).digest("hex");
    }
    safeSettings(value) {
        return value;
    }
    domainSelect() {
        return {
            id: true,
            type: true,
            hostname: true,
            subdomainLabel: true,
            status: true,
            verificationMethod: true,
            verifiedAt: true,
            lastCheckedAt: true,
            failureCode: true,
            createdAt: true,
            updatedAt: true,
        };
    }
    translateConflict(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002")
            throw new common_1.ConflictException("Organization domain is already assigned");
        throw error;
    }
};
exports.OrganizationConfigurationService = OrganizationConfigurationService;
exports.OrganizationConfigurationService = OrganizationConfigurationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        organization_domain_verification_service_1.OrganizationDomainVerificationService])
], OrganizationConfigurationService);
//# sourceMappingURL=organization-configuration.service.js.map