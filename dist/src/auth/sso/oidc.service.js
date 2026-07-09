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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const node_cache_1 = __importDefault(require("node-cache"));
const crypto_1 = require("crypto");
const openid_client_1 = require("openid-client");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const sso_secret_service_1 = require("./sso-secret.service");
const sso_ticket_service_1 = require("./sso-ticket.service");
let OidcService = class OidcService {
    constructor(prisma, config, secretService, ticketService, auditLog) {
        this.prisma = prisma;
        this.config = config;
        this.secretService = secretService;
        this.ticketService = ticketService;
        this.auditLog = auditLog;
        this.stateCache = new node_cache_1.default({
            stdTTL: 300,
            checkperiod: 60,
        });
    }
    async buildAuthorizationUrl(providerId) {
        const provider = await this.prisma.ssoProvider.findUnique({
            where: { id: providerId },
        });
        if (!provider || !provider.isActive) {
            throw new NotFoundOrInactiveSsoProviderException();
        }
        if (provider.type !== client_1.SsoProviderType.OIDC) {
            throw new common_1.BadRequestException('SSO provider is not an OIDC provider');
        }
        if (!provider.issuer || !provider.clientId) {
            throw new common_1.BadRequestException('OIDC provider is not fully configured');
        }
        const client = await this.createClient(provider);
        const state = openid_client_1.generators.state();
        const nonce = openid_client_1.generators.nonce();
        this.stateCache.set(state, {
            providerId: provider.id,
            nonce,
        });
        return client.authorizationUrl({
            scope: this.getScopes(provider.scopes),
            state,
            nonce,
        });
    }
    async handleCallback(providerId, query) {
        const frontendCallbackUrl = this.getFrontendCallbackUrl();
        try {
            const provider = await this.prisma.ssoProvider.findUnique({
                where: { id: providerId },
            });
            if (!provider || !provider.isActive) {
                throw new NotFoundOrInactiveSsoProviderException();
            }
            if (provider.type !== client_1.SsoProviderType.OIDC) {
                throw new common_1.BadRequestException('SSO provider is not an OIDC provider');
            }
            const state = query.state;
            if (!state) {
                throw new common_1.BadRequestException('Missing OIDC state');
            }
            const cached = this.stateCache.get(state);
            if (!cached || cached.providerId !== provider.id) {
                throw new common_1.BadRequestException('Invalid or expired OIDC state');
            }
            this.stateCache.del(state);
            const client = await this.createClient(provider);
            const tokenSet = await client.callback(this.getRedirectUri(provider.id), query, {
                state,
                nonce: cached.nonce,
            });
            const claims = tokenSet.claims();
            const subject = claims.sub;
            if (!subject) {
                throw new common_1.UnauthorizedException('OIDC subject is missing');
            }
            let email = typeof claims.email === 'string' && claims.email
                ? claims.email
                : undefined;
            let fullName = typeof claims.name === 'string' && claims.name
                ? claims.name
                : undefined;
            if (!email || !fullName) {
                const userInfo = await client.userinfo(tokenSet.access_token);
                if (!email && typeof userInfo.email === 'string') {
                    email = userInfo.email;
                }
                if (!fullName && typeof userInfo.name === 'string') {
                    fullName = userInfo.name;
                }
            }
            if (!email) {
                throw new common_1.UnauthorizedException('OIDC email is missing');
            }
            const identity = {
                subject,
                email: email.toLowerCase().trim(),
                fullName: fullName?.trim() || email.toLowerCase().trim(),
            };
            const user = await this.resolveOrProvisionUser(provider.id, identity);
            const ticket = await this.ticketService.createTicket(user.id, provider.id);
            await this.auditLog.record({
                actorId: user.id,
                entityType: 'SsoProvider',
                entityId: provider.id,
                action: 'sso.oidc.login.success',
                metadata: {
                    providerName: provider.name,
                    email: identity.email,
                },
            });
            return this.appendQuery(frontendCallbackUrl, {
                ticket,
                providerId: provider.id,
            });
        }
        catch (error) {
            await this.auditLog.record({
                entityType: 'SsoProvider',
                entityId: providerId,
                action: 'sso.oidc.login.failed',
                metadata: {
                    message: error instanceof Error ? error.message : 'Unknown OIDC login error',
                },
            });
            return this.appendQuery(frontendCallbackUrl, {
                error: 'oidc_login_failed',
            });
        }
    }
    async createClient(provider) {
        if (!provider.issuer || !provider.clientId) {
            throw new common_1.BadRequestException('OIDC provider is not fully configured');
        }
        const issuer = await openid_client_1.Issuer.discover(provider.issuer);
        const clientSecret = provider.clientSecretEnc
            ? this.secretService.decryptSecret(provider.clientSecretEnc)
            : undefined;
        return new issuer.Client({
            client_id: provider.clientId,
            client_secret: clientSecret,
            redirect_uris: [this.getRedirectUri(provider.id)],
            response_types: ['code'],
        });
    }
    async resolveOrProvisionUser(providerId, identity) {
        const existingIdentity = await this.prisma.externalIdentity.findUnique({
            where: {
                providerId_subject: {
                    providerId,
                    subject: identity.subject,
                },
            },
            include: {
                user: true,
            },
        });
        if (existingIdentity) {
            if (!existingIdentity.user.isActive) {
                throw new common_1.UnauthorizedException('SSO user is inactive');
            }
            return existingIdentity.user;
        }
        const provider = await this.prisma.ssoProvider.findUnique({
            where: { id: providerId },
        });
        if (!provider || !provider.isActive) {
            throw new NotFoundOrInactiveSsoProviderException();
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: identity.email },
        });
        if (existingUser) {
            await this.prisma.externalIdentity.create({
                data: {
                    providerId,
                    userId: existingUser.id,
                    subject: identity.subject,
                    email: identity.email,
                },
            });
            return existingUser;
        }
        if (!provider.autoProvision) {
            throw new common_1.UnauthorizedException('SSO auto-provisioning is disabled');
        }
        this.assertAllowedDomain(identity.email, provider.allowedDomains);
        const passwordHash = await bcrypt.hash((0, crypto_1.randomBytes)(32).toString('hex'), 10);
        const role = provider.defaultRole ?? client_1.UserRole.REP;
        const user = await this.prisma.user.create({
            data: {
                fullName: identity.fullName,
                email: identity.email,
                passwordHash,
                role,
                isActive: true,
                externalIdentities: {
                    create: {
                        providerId,
                        subject: identity.subject,
                        email: identity.email,
                    },
                },
            },
        });
        await this.auditLog.record({
            actorId: user.id,
            entityType: 'User',
            entityId: user.id,
            action: 'sso.user.provisioned',
            after: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            metadata: {
                providerId,
            },
        });
        return user;
    }
    assertAllowedDomain(email, allowedDomains) {
        if (!allowedDomains.length)
            return;
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) {
            throw new common_1.UnauthorizedException('Invalid SSO email domain');
        }
        const normalizedAllowed = allowedDomains.map((item) => item.toLowerCase().trim());
        if (!normalizedAllowed.includes(domain)) {
            throw new common_1.UnauthorizedException('SSO email domain is not allowed');
        }
    }
    getRedirectUri(providerId) {
        const backendPublicUrl = this.config.get('BACKEND_PUBLIC_URL', 'http://localhost:3000');
        return `${backendPublicUrl.replace(/\/$/, '')}/api/auth/oidc/${providerId}/callback`;
    }
    getFrontendCallbackUrl() {
        return this.config.get('FRONTEND_SSO_CALLBACK_URL', 'http://localhost:5173/auth/sso/callback');
    }
    getScopes(scopes) {
        const normalized = scopes?.length
            ? scopes
            : ['openid', 'profile', 'email'];
        return Array.from(new Set(normalized)).join(' ');
    }
    appendQuery(baseUrl, params) {
        const url = new URL(baseUrl);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        return url.toString();
    }
};
exports.OidcService = OidcService;
exports.OidcService = OidcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        sso_secret_service_1.SsoSecretService,
        sso_ticket_service_1.SsoTicketService,
        audit_log_service_1.AuditLogService])
], OidcService);
class NotFoundOrInactiveSsoProviderException extends common_1.BadRequestException {
    constructor() {
        super('SSO provider not found or inactive');
    }
}
//# sourceMappingURL=oidc.service.js.map