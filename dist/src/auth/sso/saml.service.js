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
const sso_ticket_service_1 = require("./sso-ticket.service");
let SamlService = class SamlService {
    constructor(prisma, config, ssoTicketService) {
        this.prisma = prisma;
        this.config = config;
        this.ssoTicketService = ssoTicketService;
    }
    async buildLoginUrl(providerId) {
        const provider = await this.getActiveSamlProvider(providerId);
        const saml = this.createSamlClient(provider);
        return saml.getAuthorizeUrlAsync('', undefined, {});
    }
    async handleAcs(providerId, body) {
        const provider = await this.getActiveSamlProvider(providerId);
        if (!body?.SAMLResponse) {
            throw new common_1.BadRequestException('Missing SAMLResponse');
        }
        const saml = this.createSamlClient(provider);
        const result = await saml.validatePostResponseAsync(body);
        const profile = result.profile;
        if (!profile) {
            throw new common_1.BadRequestException('Invalid SAML response profile');
        }
        const subject = this.extractSubject(profile);
        const email = this.extractEmail(provider, profile);
        const fullName = this.extractFullName(provider, profile, email);
        const user = await this.resolveUser(provider, {
            subject,
            email,
            fullName,
        });
        const ticket = await this.ssoTicketService.createTicket(user.id, provider.id);
        const frontendCallbackUrl = this.config.get('FRONTEND_SSO_CALLBACK_URL');
        if (!frontendCallbackUrl) {
            throw new common_1.InternalServerErrorException('Frontend SSO callback URL is not configured');
        }
        const url = new URL(frontendCallbackUrl);
        url.searchParams.set('ticket', ticket);
        url.searchParams.set('providerId', provider.id);
        url.searchParams.set('type', 'SAML');
        return url.toString();
    }
    async generateMetadata(providerId) {
        const provider = await this.getActiveSamlProvider(providerId);
        const saml = this.createSamlClient(provider);
        return saml.generateServiceProviderMetadata(null, null);
    }
    async getActiveSamlProvider(providerId) {
        const provider = await this.prisma.ssoProvider.findUnique({
            where: { id: providerId },
        });
        if (!provider || !provider.isActive || provider.type !== client_1.SsoProviderType.SAML) {
            throw new common_1.NotFoundException('Active SAML provider not found');
        }
        return provider;
    }
    createSamlClient(provider) {
        const callbackUrl = this.getAcsUrl(provider.id);
        const issuer = provider.entityId || this.getEntityId(provider.id);
        if (!provider.ssoUrl) {
            throw new common_1.BadRequestException('SAML provider SSO URL is not configured');
        }
        if (!provider.x509Certificate) {
            throw new common_1.BadRequestException('SAML provider X.509 certificate is not configured');
        }
        return new node_saml_1.SAML({
            callbackUrl,
            entryPoint: provider.ssoUrl,
            issuer,
            audience: issuer,
            idpCert: this.normalizeCertificate(provider.x509Certificate),
            identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            signatureAlgorithm: 'sha256',
            digestAlgorithm: 'sha256',
            wantAssertionsSigned: provider.wantAssertionsSigned,
            wantAuthnResponseSigned: provider.wantResponseSigned,
            acceptedClockSkewMs: 120000,
            disableRequestedAuthnContext: true,
        });
    }
    getBackendPublicUrl() {
        const value = this.config.get('BACKEND_PUBLIC_URL');
        if (!value) {
            throw new common_1.InternalServerErrorException('BACKEND_PUBLIC_URL is not configured');
        }
        return value.replace(/\/$/, '');
    }
    getAcsUrl(providerId) {
        return `${this.getBackendPublicUrl()}/api/auth/saml/${providerId}/acs`;
    }
    getEntityId(providerId) {
        return `${this.getBackendPublicUrl()}/api/auth/saml/${providerId}/metadata`;
    }
    normalizeCertificate(value) {
        const trimmed = value.trim();
        if (trimmed.includes('BEGIN CERTIFICATE')) {
            return trimmed;
        }
        const body = trimmed.replace(/\s+/g, '');
        const rows = body.match(/.{1,64}/g)?.join('\n') ?? body;
        return `-----BEGIN CERTIFICATE-----\n${rows}\n-----END CERTIFICATE-----`;
    }
    extractSubject(profile) {
        const subject = profile.nameID || profile.nameId;
        if (!subject || typeof subject !== 'string') {
            throw new common_1.BadRequestException('SAML subject NameID is missing');
        }
        return subject;
    }
    extractEmail(provider, profile) {
        const configured = this.getStringAttribute(profile, provider.emailAttribute);
        const fallback = configured ||
            this.getStringAttribute(profile, 'email') ||
            this.getStringAttribute(profile, 'mail') ||
            this.getStringAttribute(profile, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ||
            this.getStringAttribute(profile, 'urn:oid:0.9.2342.19200300.100.1.3') ||
            profile.nameID ||
            profile.nameId;
        if (!fallback || typeof fallback !== 'string') {
            throw new common_1.BadRequestException('SAML email attribute is missing');
        }
        return fallback.toLowerCase();
    }
    extractFullName(provider, profile, email) {
        return (this.getStringAttribute(profile, provider.nameAttribute) ||
            this.getStringAttribute(profile, 'displayName') ||
            this.getStringAttribute(profile, 'name') ||
            this.getStringAttribute(profile, 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name') ||
            email);
    }
    getStringAttribute(profile, key) {
        if (!key) {
            return undefined;
        }
        const value = profile[key];
        if (typeof value === 'string') {
            return value;
        }
        if (Array.isArray(value) && typeof value[0] === 'string') {
            return value[0];
        }
        return undefined;
    }
    async resolveUser(provider, input) {
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
                throw new common_1.BadRequestException('User is inactive');
            }
            return existingIdentity.user;
        }
        const existingUser = await this.prisma.user.findUnique({
            where: {
                email: input.email,
            },
        });
        if (existingUser) {
            if (!existingUser.isActive) {
                throw new common_1.BadRequestException('User is inactive');
            }
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
            throw new common_1.BadRequestException('User is not provisioned');
        }
        this.assertAllowedDomain(provider, input.email);
        const role = provider.defaultRole || client_1.UserRole.REP;
        const passwordHash = await bcrypt.hash((0, crypto_1.randomBytes)(32).toString('hex'), 12);
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: input.email,
                    fullName: input.fullName,
                    passwordHash,
                    role,
                    isActive: true,
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
    assertAllowedDomain(provider, email) {
        if (!provider.allowedDomains.length) {
            return;
        }
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain || !provider.allowedDomains.includes(domain)) {
            throw new common_1.BadRequestException('Email domain is not allowed');
        }
    }
};
exports.SamlService = SamlService;
exports.SamlService = SamlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        sso_ticket_service_1.SsoTicketService])
], SamlService);
//# sourceMappingURL=saml.service.js.map