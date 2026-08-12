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
exports.OidcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const crypto_1 = require("crypto");
const openid_client_1 = require("openid-client");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const sso_network_security_service_1 = require("./sso-network-security.service");
const sso_secret_service_1 = require("./sso-secret.service");
const sso_ticket_service_1 = require("./sso-ticket.service");
let OidcService = class OidcService {
    constructor(prisma, config, secrets, tickets, audit, network) {
        this.prisma = prisma;
        this.config = config;
        this.secrets = secrets;
        this.tickets = tickets;
        this.audit = audit;
        this.network = network;
    }
    async buildAuthorizationUrl(providerId, kind, rawRoute) {
        const route = rawRoute
            .trim()
            .toLowerCase()
            .replace(/^\.+|\.+$/g, "");
        if (!route)
            throw new common_1.BadRequestException("Verified tenant route is required");
        const provider = await this.prisma.ssoProvider.findFirst({
            where: {
                id: providerId,
                type: client_1.SsoProviderType.OIDC,
                isActive: true,
                organization: { status: client_1.OrganizationStatus.ACTIVE },
                routes: { some: { kind: client_1.SsoRoutingKind[kind], value: route } },
            },
        });
        if (!provider?.organizationId)
            throw new common_1.BadRequestException("SSO provider not found or inactive");
        const client = await this.createClient(provider);
        const state = openid_client_1.generators.state();
        const nonce = openid_client_1.generators.nonce();
        const verifier = openid_client_1.generators.codeVerifier();
        const challenge = openid_client_1.generators.codeChallenge(verifier);
        await this.prisma.ssoAuthTransaction.create({
            data: {
                stateHash: this.hash(state),
                organizationId: provider.organizationId,
                providerId: provider.id,
                nonceEnc: this.secrets.encryptSecret(nonce),
                pkceVerifierEnc: this.secrets.encryptSecret(verifier),
                redirectTarget: this.frontendUrl(),
                expiresAt: new Date(Date.now() + 5 * 60_000),
            },
        });
        return client.authorizationUrl({
            scope: this.scopes(provider.scopes),
            state,
            nonce,
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });
    }
    async handleCallback(providerId, query) {
        const frontend = this.frontendUrl();
        try {
            const state = query.state;
            if (!state)
                throw new common_1.BadRequestException("Missing OIDC state");
            const transaction = await this.consume(state);
            if (transaction.providerId !== providerId ||
                transaction.organizationId !== transaction.provider.organizationId)
                throw new common_1.BadRequestException("Invalid OIDC provider state");
            const provider = transaction.provider;
            if (!provider.organizationId ||
                !provider.isActive ||
                provider.type !== client_1.SsoProviderType.OIDC ||
                provider.organization?.status !== client_1.OrganizationStatus.ACTIVE)
                throw new common_1.BadRequestException("SSO provider not found or inactive");
            const nonce = transaction.nonceEnc
                ? this.secrets.decryptSecret(transaction.nonceEnc)
                : undefined;
            const verifier = transaction.pkceVerifierEnc
                ? this.secrets.decryptSecret(transaction.pkceVerifierEnc)
                : undefined;
            if (!nonce || !verifier)
                throw new common_1.BadRequestException("OIDC transaction is incomplete");
            const client = await this.createClient(provider);
            const tokenSet = await client.callback(this.redirectUri(provider.id), query, { state, nonce, code_verifier: verifier });
            const claims = tokenSet.claims();
            let email = typeof claims.email === "string" ? claims.email : undefined;
            let fullName = typeof claims.name === "string" ? claims.name : undefined;
            let groups = this.groups(claims[provider.groupsAttribute ?? "groups"]);
            if (!email || !fullName) {
                const userInfo = (await client.userinfo(tokenSet.access_token));
                email ||=
                    typeof userInfo.email === "string" ? userInfo.email : undefined;
                fullName ||=
                    typeof userInfo.name === "string" ? userInfo.name : undefined;
                if (!groups.length)
                    groups = this.groups(userInfo[provider.groupsAttribute ?? "groups"]);
            }
            if (typeof claims.sub !== "string" || !email)
                throw new common_1.UnauthorizedException("OIDC identity is incomplete");
            const identity = {
                subject: claims.sub,
                email: email.trim().toLowerCase(),
                fullName: fullName?.trim() || email,
                groups,
            };
            const user = await this.resolveIdentity(provider, identity);
            const ticket = await this.tickets.createTicket(user.id, provider.id);
            await this.audit.record({
                actorId: user.id,
                organizationId: provider.organizationId,
                entityType: "SsoProvider",
                entityId: provider.id,
                action: "sso.oidc.login.success",
            });
            return this.append(frontend, { ticket, providerId: provider.id });
        }
        catch (error) {
            await this.audit.record({
                organizationId: null,
                entityType: "SsoProvider",
                entityId: providerId,
                action: "sso.oidc.login.failed",
                metadata: { category: this.failureCategory(error) },
            });
            return this.append(frontend, { error: "oidc_login_failed" });
        }
    }
    async consume(state) {
        return this.prisma.$transaction(async (tx) => {
            const found = await tx.ssoAuthTransaction.findUnique({
                where: { stateHash: this.hash(state) },
                include: { provider: { include: { organization: true } } },
            });
            if (!found || found.consumedAt || found.expiresAt <= new Date())
                throw new common_1.BadRequestException("Invalid or expired OIDC state");
            const consumed = await tx.ssoAuthTransaction.updateMany({
                where: {
                    id: found.id,
                    consumedAt: null,
                    expiresAt: { gt: new Date() },
                },
                data: { consumedAt: new Date() },
            });
            if (consumed.count !== 1)
                throw new common_1.BadRequestException("OIDC state has already been consumed");
            return found;
        });
    }
    async resolveIdentity(provider, identity) {
        if (!provider.organizationId)
            throw new common_1.UnauthorizedException("Provider tenant ownership is incomplete");
        const organizationId = provider.organizationId;
        this.allowedDomain(identity.email, provider.allowedDomains);
        const roleId = await this.mappedRole(provider.id, identity.groups);
        const passwordHash = await bcrypt.hash((0, crypto_1.randomBytes)(32).toString("hex"), 10);
        return this.prisma.$transaction(async (tx) => {
            const linked = await tx.externalIdentity.findUnique({
                where: {
                    providerId_subject: {
                        providerId: provider.id,
                        subject: identity.subject,
                    },
                },
                include: { user: true },
            });
            let user = linked?.user ??
                (await tx.user.findUnique({ where: { email: identity.email } }));
            if (user && !user.isActive)
                throw new common_1.UnauthorizedException("SSO user is inactive");
            if (!user && !provider.autoProvision)
                throw new common_1.UnauthorizedException("SSO auto-provisioning is disabled");
            if (!user)
                user = await tx.user.create({
                    data: {
                        email: identity.email,
                        fullName: identity.fullName,
                        passwordHash,
                        role: client_1.UserRole.REP,
                        organizationId,
                        isActive: true,
                    },
                });
            const membership = await tx.organizationMembership.findUnique({
                where: { userId_organizationId: { userId: user.id, organizationId } },
            });
            if (membership &&
                membership.status !== client_1.OrganizationMembershipStatus.ACTIVE)
                throw new common_1.UnauthorizedException("SSO membership is inactive");
            if (!membership) {
                if (!provider.autoProvision)
                    throw new common_1.UnauthorizedException("SSO membership is not provisioned");
                await tx.organizationMembership.create({
                    data: {
                        userId: user.id,
                        organizationId,
                        roleId,
                        status: client_1.OrganizationMembershipStatus.ACTIVE,
                        isDefault: false,
                        joinedAt: new Date(),
                    },
                });
            }
            if (!linked)
                await tx.externalIdentity.create({
                    data: {
                        providerId: provider.id,
                        userId: user.id,
                        subject: identity.subject,
                        email: identity.email,
                    },
                });
            return user;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async mappedRole(providerId, groups) {
        if (!groups.length)
            return null;
        const mappings = await this.prisma.ssoGroupRoleMapping.findMany({
            where: { providerId, normalizedGroup: { in: groups } },
            select: { roleId: true },
        });
        const roleIds = [...new Set(mappings.map((item) => item.roleId))];
        if (roleIds.length > 1)
            throw new common_1.UnauthorizedException("Conflicting SSO group mappings");
        return roleIds[0] ?? null;
    }
    async createClient(provider) {
        if (!provider.issuer ||
            !provider.clientId ||
            !provider.authorizationUrl ||
            !provider.tokenUrl ||
            !provider.jwksUrl)
            throw new common_1.BadRequestException("OIDC provider is not fully configured");
        const [issuerUrl, authorizationUrl, tokenUrl, jwksUrl] = await Promise.all([
            this.network.assertResolvablePublicUrl(provider.issuer),
            this.network.assertResolvablePublicUrl(provider.authorizationUrl),
            this.network.assertResolvablePublicUrl(provider.tokenUrl),
            this.network.assertResolvablePublicUrl(provider.jwksUrl),
        ]);
        const userInfoUrl = provider.userInfoUrl
            ? await this.network.assertResolvablePublicUrl(provider.userInfoUrl)
            : undefined;
        if ([authorizationUrl, tokenUrl, jwksUrl, userInfoUrl]
            .filter(Boolean)
            .some((url) => url.origin !== issuerUrl.origin))
            throw new common_1.BadRequestException("OIDC endpoint origin does not match issuer");
        openid_client_1.custom.setHttpOptionsDefaults({ timeout: 5000 });
        const issuer = new openid_client_1.Issuer({
            issuer: issuerUrl.toString(),
            authorization_endpoint: authorizationUrl.toString(),
            token_endpoint: tokenUrl.toString(),
            jwks_uri: jwksUrl.toString(),
            userinfo_endpoint: userInfoUrl?.toString(),
        });
        return new issuer.Client({
            client_id: provider.clientId,
            client_secret: provider.clientSecretEnc
                ? this.secrets.decryptSecret(provider.clientSecretEnc)
                : undefined,
            redirect_uris: [this.redirectUri(provider.id)],
            response_types: ["code"],
        });
    }
    allowedDomain(email, allowed) {
        const domain = email.split("@")[1]?.toLowerCase();
        if (!domain || (allowed.length && !allowed.includes(domain)))
            throw new common_1.UnauthorizedException("SSO email domain is not allowed");
    }
    groups(value) {
        const list = Array.isArray(value)
            ? value
            : typeof value === "string"
                ? [value]
                : [];
        return [
            ...new Set(list
                .filter((item) => typeof item === "string")
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean)),
        ];
    }
    hash(value) {
        return (0, crypto_1.createHash)("sha256").update(value).digest("hex");
    }
    scopes(value) {
        return [
            ...new Set(value.length ? value : ["openid", "profile", "email"]),
        ].join(" ");
    }
    redirectUri(id) {
        return `${this.config.get("BACKEND_PUBLIC_URL", "http://localhost:3000").replace(/\/$/, "")}/api/auth/oidc/${id}/callback`;
    }
    frontendUrl() {
        return this.config.get("FRONTEND_SSO_CALLBACK_URL", "http://localhost:5173/auth/sso/callback");
    }
    append(base, params) {
        const url = new URL(base);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        return url.toString();
    }
    failureCategory(error) {
        return error instanceof common_1.UnauthorizedException
            ? "IDENTITY_REJECTED"
            : error instanceof common_1.BadRequestException
                ? "PROTOCOL_REJECTED"
                : "INTERNAL_FAILURE";
    }
};
exports.OidcService = OidcService;
exports.OidcService = OidcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        sso_secret_service_1.SsoSecretService,
        sso_ticket_service_1.SsoTicketService,
        audit_log_service_1.AuditLogService,
        sso_network_security_service_1.SsoNetworkSecurityService])
], OidcService);
//# sourceMappingURL=oidc.service.js.map