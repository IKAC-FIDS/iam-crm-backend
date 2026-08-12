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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_saml_1 = require("@node-saml/node-saml");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const sso_ticket_service_1 = require("./sso-ticket.service");
const crypto_2 = require("crypto");
let SamlService = class SamlService {
    constructor(prisma, config, ssoTicketService, audit) {
        this.prisma = prisma;
        this.config = config;
        this.ssoTicketService = ssoTicketService;
        this.audit = audit;
    }
    async buildLoginUrl(providerId, kind, rawRoute) {
        const provider = await this.getActiveSamlProvider(providerId, kind, rawRoute);
        const saml = this.createSamlClient(provider);
        const state = (0, crypto_1.randomBytes)(48).toString("base64url");
        await this.prisma.ssoAuthTransaction.create({
            data: {
                stateHash: this.hash(state),
                organizationId: provider.organizationId,
                providerId,
                redirectTarget: this.frontendCallback(),
                expiresAt: new Date(Date.now() + 5 * 60_000),
            },
        });
        return saml.getAuthorizeUrlAsync(state, undefined, {});
    }
    async handleAcs(providerId, body) {
        try {
            return await this.handleAcsInternal(providerId, body);
        }
        catch (error) {
            await this.audit.record({
                organizationId: null,
                entityType: "SsoProvider",
                entityId: providerId,
                action: "sso.saml.login.failed",
                metadata: {
                    category: error instanceof common_1.BadRequestException
                        ? "INVALID_ASSERTION_OR_STATE"
                        : "AUTHENTICATION_FAILED",
                },
            });
            throw error;
        }
    }
    async handleAcsInternal(providerId, body) {
        const state = typeof body?.RelayState === "string" ? body.RelayState : "";
        const transaction = await this.consumeState(state);
        if (transaction.providerId !== providerId)
            throw new common_1.BadRequestException("Invalid SAML provider state");
        const provider = await this.getActiveSamlProviderByOwnership(providerId, transaction.organizationId);
        if (!body?.SAMLResponse) {
            throw new common_1.BadRequestException("Missing SAMLResponse");
        }
        const saml = this.createSamlClient(provider);
        const result = await saml.validatePostResponseAsync(body);
        const profile = result.profile;
        if (!profile) {
            throw new common_1.BadRequestException("Invalid SAML response profile");
        }
        const subject = this.extractSubject(profile);
        const email = this.extractEmail(provider, profile);
        const fullName = this.extractFullName(provider, profile, email);
        const groups = this.extractGroups(provider, profile);
        const user = await this.resolveUser(provider, {
            subject,
            email,
            fullName,
            groups,
        });
        const ticket = await this.ssoTicketService.createTicket(user.id, provider.id);
        await this.audit.record({
            actorId: user.id,
            organizationId: provider.organizationId,
            entityType: "SsoProvider",
            entityId: provider.id,
            action: "sso.saml.login.success",
        });
        const frontendCallbackUrl = this.frontendCallback();
        if (!frontendCallbackUrl) {
            throw new common_1.InternalServerErrorException("Frontend SSO callback URL is not configured");
        }
        const url = new URL(frontendCallbackUrl);
        url.searchParams.set("ticket", ticket);
        url.searchParams.set("providerId", provider.id);
        url.searchParams.set("type", "SAML");
        return url.toString();
    }
    async generateMetadata(providerId, kind, rawRoute) {
        const provider = await this.getActiveSamlProvider(providerId, kind, rawRoute);
        const saml = this.createSamlClient(provider);
        return saml.generateServiceProviderMetadata(null, null);
    }
    async getActiveSamlProvider(providerId, kind, rawRoute) {
        const route = rawRoute
            .trim()
            .toLowerCase()
            .replace(/^\.+|\.+$/g, "");
        if (!route)
            throw new common_1.NotFoundException("Active SAML provider not found");
        const provider = await this.prisma.ssoProvider.findFirst({
            where: {
                id: providerId,
                organizationId: { not: null },
                organization: { status: client_1.OrganizationStatus.ACTIVE },
                routes: { some: { kind: client_1.SsoRoutingKind[kind], value: route } },
            },
        });
        if (!provider ||
            !provider.isActive ||
            provider.type !== client_1.SsoProviderType.SAML) {
            throw new common_1.NotFoundException("Active SAML provider not found");
        }
        return provider;
    }
    async getActiveSamlProviderByOwnership(providerId, organizationId) {
        const provider = await this.prisma.ssoProvider.findFirst({
            where: {
                id: providerId,
                organizationId,
                isActive: true,
                type: client_1.SsoProviderType.SAML,
                organization: { status: client_1.OrganizationStatus.ACTIVE },
            },
        });
        if (!provider)
            throw new common_1.NotFoundException("Active SAML provider not found");
        return provider;
    }
    createSamlClient(provider) {
        const callbackUrl = this.getAcsUrl(provider.id);
        const issuer = provider.entityId || this.getEntityId(provider.id);
        if (!provider.ssoUrl) {
            throw new common_1.BadRequestException("SAML provider SSO URL is not configured");
        }
        if (!provider.x509Certificate) {
            throw new common_1.BadRequestException("SAML provider X.509 certificate is not configured");
        }
        return new node_saml_1.SAML({
            callbackUrl,
            entryPoint: provider.ssoUrl,
            issuer,
            audience: issuer,
            idpCert: this.normalizeCertificate(provider.x509Certificate),
            identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
            signatureAlgorithm: "sha256",
            digestAlgorithm: "sha256",
            wantAssertionsSigned: provider.wantAssertionsSigned,
            wantAuthnResponseSigned: provider.wantResponseSigned,
            validateInResponseTo: node_saml_1.ValidateInResponseTo.always,
            acceptedClockSkewMs: 120000,
            disableRequestedAuthnContext: true,
        });
    }
    getBackendPublicUrl() {
        const value = this.config.get("BACKEND_PUBLIC_URL");
        if (!value) {
            throw new common_1.InternalServerErrorException("BACKEND_PUBLIC_URL is not configured");
        }
        return value.replace(/\/$/, "");
    }
    getAcsUrl(providerId) {
        return `${this.getBackendPublicUrl()}/api/auth/saml/${providerId}/acs`;
    }
    getEntityId(providerId) {
        return `${this.getBackendPublicUrl()}/api/auth/saml/${providerId}/metadata`;
    }
    normalizeCertificate(value) {
        const trimmed = value.trim();
        if (trimmed.includes("BEGIN CERTIFICATE")) {
            return trimmed;
        }
        const body = trimmed.replace(/\s+/g, "");
        const rows = body.match(/.{1,64}/g)?.join("\n") ?? body;
        return `-----BEGIN CERTIFICATE-----\n${rows}\n-----END CERTIFICATE-----`;
    }
    extractSubject(profile) {
        const subject = profile.nameID || profile.nameId;
        if (!subject || typeof subject !== "string") {
            throw new common_1.BadRequestException("SAML subject NameID is missing");
        }
        return subject;
    }
    extractEmail(provider, profile) {
        const configured = this.getStringAttribute(profile, provider.emailAttribute);
        const fallback = configured ||
            this.getStringAttribute(profile, "email") ||
            this.getStringAttribute(profile, "mail") ||
            this.getStringAttribute(profile, "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") ||
            this.getStringAttribute(profile, "urn:oid:0.9.2342.19200300.100.1.3") ||
            profile.nameID ||
            profile.nameId;
        if (!fallback || typeof fallback !== "string") {
            throw new common_1.BadRequestException("SAML email attribute is missing");
        }
        return fallback.toLowerCase();
    }
    extractFullName(provider, profile, email) {
        return (this.getStringAttribute(profile, provider.nameAttribute) ||
            this.getStringAttribute(profile, "displayName") ||
            this.getStringAttribute(profile, "name") ||
            this.getStringAttribute(profile, "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name") ||
            email);
    }
    getStringAttribute(profile, key) {
        if (!key) {
            return undefined;
        }
        const value = profile[key];
        if (typeof value === "string") {
            return value;
        }
        if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
        }
        return undefined;
    }
    async resolveUser(provider, input) {
        const mappedRoleId = await this.mappedRole(this.prisma, provider.id, input.groups);
        const existingIdentity = await this.prisma.externalIdentity.findUnique({
            where: {
                providerId_subject: {
                    providerId: provider.id,
                    subject: input.subject,
                },
            },
            include: {
                user: true,
            },
        });
        if (existingIdentity) {
            if (!existingIdentity.user.isActive) {
                throw new common_1.BadRequestException("User is inactive");
            }
            await this.assertOrCreateMembership(provider, existingIdentity.user.id, false, mappedRoleId);
            return existingIdentity.user;
        }
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: input.email,
            },
        });
        if (existingUser) {
            if (!existingUser.isActive) {
                throw new common_1.BadRequestException("User is inactive");
            }
            await this.assertOrCreateMembership(provider, existingUser.id, provider.autoProvision, mappedRoleId);
            await this.prisma.externalIdentity.create({
                data: {
                    providerId: provider.id,
                    userId: existingUser.id,
                    subject: input.subject,
                    email: input.email,
                },
            });
            return existingUser;
        }
        if (!provider.autoProvision) {
            throw new common_1.BadRequestException("User is not provisioned");
        }
        this.assertAllowedDomain(provider, input.email);
        const passwordHash = await bcrypt.hash((0, crypto_1.randomBytes)(32).toString("hex"), 12);
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: input.email,
                    fullName: input.fullName,
                    passwordHash,
                    role: client_1.UserRole.REP,
                    organizationId: provider.organizationId,
                    isActive: true,
                },
            });
            await tx.organizationMembership.create({
                data: {
                    userId: user.id,
                    organizationId: provider.organizationId,
                    roleId: mappedRoleId,
                    status: client_1.OrganizationMembershipStatus.ACTIVE,
                    isDefault: false,
                    joinedAt: new Date(),
                },
            });
            await tx.externalIdentity.create({
                data: {
                    providerId: provider.id,
                    userId: user.id,
                    subject: input.subject,
                    email: input.email,
                },
            });
            return user;
        });
    }
    extractGroups(provider, profile) {
        if (!provider.groupsAttribute)
            return [];
        const value = profile[provider.groupsAttribute];
        const values = Array.isArray(value)
            ? value
            : typeof value === "string"
                ? [value]
                : [];
        return [
            ...new Set(values
                .filter((item) => typeof item === "string")
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean)),
        ];
    }
    async mappedRole(tx, providerId, groups) {
        if (!groups.length)
            return null;
        const mappings = await tx.ssoGroupRoleMapping.findMany({
            where: { providerId, normalizedGroup: { in: groups } },
            select: { roleId: true },
        });
        const roles = [...new Set(mappings.map((item) => item.roleId))];
        if (roles.length > 1)
            throw new common_1.BadRequestException("Conflicting SSO group mappings");
        return roles[0] ?? null;
    }
    async assertOrCreateMembership(provider, userId, allowCreate, roleId) {
        if (!provider.organizationId)
            throw new common_1.BadRequestException("Provider tenant ownership is incomplete");
        const membership = await this.prisma.organizationMembership.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: provider.organizationId,
                },
            },
        });
        if (membership?.status !== client_1.OrganizationMembershipStatus.ACTIVE) {
            if (membership || !allowCreate)
                throw new common_1.BadRequestException("SSO membership is inactive or missing");
            await this.prisma.organizationMembership.create({
                data: {
                    userId,
                    organizationId: provider.organizationId,
                    roleId,
                    status: client_1.OrganizationMembershipStatus.ACTIVE,
                    isDefault: false,
                    joinedAt: new Date(),
                },
            });
        }
    }
    async consumeState(state) {
        if (!state)
            throw new common_1.BadRequestException("Missing SAML RelayState");
        return this.prisma.$transaction(async (tx) => {
            const found = await tx.ssoAuthTransaction.findUnique({
                where: { stateHash: this.hash(state) },
            });
            if (!found || found.consumedAt || found.expiresAt <= new Date())
                throw new common_1.BadRequestException("Invalid or expired SAML state");
            const updated = await tx.ssoAuthTransaction.updateMany({
                where: { id: found.id, consumedAt: null },
                data: { consumedAt: new Date() },
            });
            if (updated.count !== 1)
                throw new common_1.BadRequestException("SAML state already consumed");
            return found;
        });
    }
    hash(value) {
        return (0, crypto_2.createHash)("sha256").update(value).digest("hex");
    }
    frontendCallback() {
        const value = this.config.get("FRONTEND_SSO_CALLBACK_URL");
        if (!value)
            throw new common_1.InternalServerErrorException("Frontend SSO callback URL is not configured");
        return value;
    }
    assertAllowedDomain(provider, email) {
        if (!provider.allowedDomains.length) {
            return;
        }
        const domain = email.split("@")[1]?.toLowerCase();
        if (!domain || !provider.allowedDomains.includes(domain)) {
            throw new common_1.BadRequestException("Email domain is not allowed");
        }
    }
};
exports.SamlService = SamlService;
exports.SamlService = SamlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        sso_ticket_service_1.SsoTicketService,
        audit_log_service_1.AuditLogService])
], SamlService);
//# sourceMappingURL=saml.service.js.map