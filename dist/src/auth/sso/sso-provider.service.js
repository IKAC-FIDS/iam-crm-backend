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
exports.SsoProviderService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const sso_provider_response_dto_1 = require("./dto/sso-provider-response.dto");
const sso_network_security_service_1 = require("./sso-network-security.service");
const sso_secret_service_1 = require("./sso-secret.service");
const providerInclude = { routes: true, groupRoleMappings: true };
let SsoProviderService = class SsoProviderService {
    constructor(prisma, secrets, audit, network) {
        this.prisma = prisma;
        this.secrets = secrets;
        this.audit = audit;
        this.network = network;
    }
    async discoverPublicProviders(kind, rawValue) {
        const value = this.normalizeRoute(rawValue, kind);
        const route = await this.prisma.ssoProviderRoute.findUnique({
            where: { kind_value: { kind: client_1.SsoRoutingKind[kind], value } },
            include: {
                provider: { include: { organization: { select: { status: true } } } },
            },
        });
        if (!route ||
            !route.provider.isActive ||
            route.provider.organization?.status !== client_1.OrganizationStatus.ACTIVE)
            return [];
        return [(0, sso_provider_response_dto_1.toPublicSsoProviderResponse)(route.provider)];
    }
    async listProviders(tenant) {
        const providers = await this.prisma.ssoProvider.findMany({
            where: { organizationId: tenant.organizationId },
            include: providerInclude,
            orderBy: { createdAt: "desc" },
        });
        return providers.map(sso_provider_response_dto_1.toSsoProviderResponse);
    }
    async getProvider(id, tenant) {
        return (0, sso_provider_response_dto_1.toSsoProviderResponse)(await this.tenantProvider(id, tenant.organizationId));
    }
    async createProvider(dto, tenant, actorId) {
        this.validateInput(dto.type, dto);
        await this.validateMappings(dto.groupRoleMappings, tenant.organizationId);
        try {
            const provider = await this.prisma.ssoProvider.create({
                data: {
                    ...this.baseData(dto),
                    organization: { connect: { id: tenant.organizationId } },
                    normalizedName: this.normalizeName(dto.name),
                    routes: { create: this.routes(dto, tenant.organizationId) },
                    groupRoleMappings: { create: this.mappings(dto) },
                },
                include: providerInclude,
            });
            const response = (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
            await this.record(actorId, tenant.organizationId, provider.id, "sso.provider.created", undefined, response);
            return response;
        }
        catch (error) {
            this.translateConflict(error);
        }
    }
    async updateProvider(id, dto, tenant, actorId) {
        const existing = await this.tenantProvider(id, tenant.organizationId);
        this.validateInput(dto.type ?? existing.type, dto);
        await this.validateMappings(dto.groupRoleMappings, tenant.organizationId);
        const existingDomains = existing.routes
            .filter((route) => route.kind === client_1.SsoRoutingKind.DOMAIN)
            .map((route) => route.value);
        const existingSubdomains = existing.routes
            .filter((route) => route.kind === client_1.SsoRoutingKind.SUBDOMAIN)
            .map((route) => route.value);
        try {
            const provider = await this.prisma.ssoProvider.update({
                where: { id },
                data: {
                    ...this.updateData(dto),
                    ...(dto.name !== undefined && {
                        normalizedName: this.normalizeName(dto.name),
                    }),
                    ...((dto.routingDomains !== undefined ||
                        dto.routingSubdomains !== undefined) && {
                        routes: {
                            deleteMany: {},
                            create: this.routes({
                                routingDomains: dto.routingDomains ?? existingDomains,
                                routingSubdomains: dto.routingSubdomains ?? existingSubdomains,
                            }, tenant.organizationId),
                        },
                    }),
                    ...(dto.groupRoleMappings !== undefined && {
                        groupRoleMappings: { deleteMany: {}, create: this.mappings(dto) },
                    }),
                },
                include: providerInclude,
            });
            const response = (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
            await this.record(actorId, tenant.organizationId, id, "sso.provider.updated", (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing), response, {
                secretReplaced: dto.clientSecret !== undefined,
                certificateReplaced: dto.x509Certificate !== undefined,
                mappingsChanged: dto.groupRoleMappings !== undefined,
            });
            return response;
        }
        catch (error) {
            this.translateConflict(error);
        }
    }
    async disableProvider(id, tenant, actorId) {
        const existing = await this.tenantProvider(id, tenant.organizationId);
        const provider = await this.prisma.ssoProvider.update({
            where: { id },
            data: { isActive: false },
            include: providerInclude,
        });
        const response = (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
        await this.record(actorId, tenant.organizationId, id, "sso.provider.disabled", (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing), response);
        return response;
    }
    async deleteProvider(id, tenant, actorId) {
        const existing = await this.prisma.ssoProvider.findFirst({
            where: { id, organizationId: tenant.organizationId },
            include: {
                ...providerInclude,
                _count: { select: { externalIdentities: true, loginTickets: true } },
            },
        });
        if (!existing)
            throw new common_1.NotFoundException("SSO provider not found");
        if (existing._count.externalIdentities || existing._count.loginTickets)
            return this.disableProvider(id, tenant, actorId);
        const response = (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing);
        await this.prisma.ssoProvider.delete({ where: { id } });
        await this.record(actorId, tenant.organizationId, id, "sso.provider.deleted", response);
        return response;
    }
    async testConnection(id, tenant, actorId) {
        const provider = await this.tenantProvider(id, tenant.organizationId);
        const target = provider.type === client_1.SsoProviderType.OIDC
            ? provider.issuer
            : provider.ssoUrl;
        if (!target)
            throw new common_1.BadRequestException("Provider endpoint is not configured");
        const result = await this.network.probe(target);
        await this.record(actorId, tenant.organizationId, id, "sso.provider.tested", undefined, undefined, result);
        return result;
    }
    tenantProvider(id, organizationId) {
        return this.prisma.ssoProvider
            .findFirst({ where: { id, organizationId }, include: providerInclude })
            .then((row) => {
            if (!row)
                throw new common_1.NotFoundException("SSO provider not found");
            return row;
        });
    }
    baseData(dto) {
        return {
            name: dto.name.trim(),
            type: dto.type,
            isActive: dto.isActive ?? true,
            autoProvision: dto.autoProvision ?? false,
            defaultRole: dto.defaultRole ?? "REP",
            allowedDomains: this.list(dto.allowedDomains).map((value) => this.normalizeRoute(value, "DOMAIN")),
            issuer: this.url(dto.issuer),
            clientId: this.text(dto.clientId),
            clientSecretEnc: dto.clientSecret
                ? this.secrets.encryptSecret(dto.clientSecret)
                : null,
            authorizationUrl: this.url(dto.authorizationUrl),
            tokenUrl: this.url(dto.tokenUrl),
            userInfoUrl: this.url(dto.userInfoUrl),
            jwksUrl: this.url(dto.jwksUrl),
            scopes: this.list(dto.scopes, ["openid", "profile", "email"]),
            entityId: this.text(dto.entityId),
            ssoUrl: this.url(dto.ssoUrl),
            x509Certificate: this.text(dto.x509Certificate),
            signRequests: dto.signRequests ?? false,
            wantAssertionsSigned: dto.wantAssertionsSigned ?? true,
            wantResponseSigned: dto.wantResponseSigned ?? false,
            emailAttribute: this.text(dto.emailAttribute),
            nameAttribute: this.text(dto.nameAttribute),
            groupsAttribute: this.text(dto.groupsAttribute),
        };
    }
    updateData(dto) {
        const data = {};
        for (const key of [
            "name",
            "type",
            "isActive",
            "autoProvision",
            "defaultRole",
            "signRequests",
            "wantAssertionsSigned",
            "wantResponseSigned",
        ])
            if (dto[key] !== undefined)
                data[key] =
                    typeof dto[key] === "string" && key === "name"
                        ? dto[key].trim()
                        : dto[key];
        if (dto.allowedDomains !== undefined)
            data.allowedDomains = this.list(dto.allowedDomains).map((value) => this.normalizeRoute(value, "DOMAIN"));
        for (const key of [
            "issuer",
            "authorizationUrl",
            "tokenUrl",
            "userInfoUrl",
            "jwksUrl",
            "ssoUrl",
        ])
            if (dto[key] !== undefined)
                data[key] = this.url(dto[key]);
        for (const key of [
            "clientId",
            "entityId",
            "x509Certificate",
            "emailAttribute",
            "nameAttribute",
            "groupsAttribute",
        ])
            if (dto[key] !== undefined)
                data[key] = this.text(dto[key]);
        if (dto.clientSecret !== undefined)
            data.clientSecretEnc = dto.clientSecret
                ? this.secrets.encryptSecret(dto.clientSecret)
                : null;
        if (dto.scopes !== undefined)
            data.scopes = this.list(dto.scopes, ["openid", "profile", "email"]);
        return data;
    }
    routes(dto, organizationId) {
        return [
            ...this.list(dto.routingDomains).map((value) => ({
                organizationId,
                kind: client_1.SsoRoutingKind.DOMAIN,
                value: this.normalizeRoute(value, "DOMAIN"),
            })),
            ...this.list(dto.routingSubdomains).map((value) => ({
                organizationId,
                kind: client_1.SsoRoutingKind.SUBDOMAIN,
                value: this.normalizeRoute(value, "SUBDOMAIN"),
            })),
        ];
    }
    mappings(dto) {
        return (dto.groupRoleMappings ?? []).map((item) => ({
            normalizedGroup: item.group.trim().toLowerCase(),
            roleId: item.roleId,
        }));
    }
    async validateMappings(mappings, organizationId) {
        if (!mappings?.length)
            return;
        const normalized = mappings.map((item) => item.group.trim().toLowerCase());
        if (new Set(normalized).size !== normalized.length)
            throw new common_1.BadRequestException("Duplicate SSO group mapping");
        const roles = await this.prisma.role.findMany({
            where: {
                id: { in: mappings.map((item) => item.roleId) },
                isActive: true,
                OR: [
                    { scope: 'SYSTEM', organizationId: null },
                    { scope: 'TENANT', organizationId },
                ],
            },
            select: { id: true },
        });
        if (roles.length !== new Set(mappings.map((item) => item.roleId)).size)
            throw new common_1.BadRequestException("SSO group mapping role is invalid or inactive");
    }
    validateInput(type, dto) {
        if (dto.name !== undefined && !dto.name.trim())
            throw new common_1.BadRequestException("SSO provider name is required");
        if (type === client_1.SsoProviderType.OIDC &&
            dto.scopes &&
            !dto.scopes.includes("openid"))
            throw new common_1.BadRequestException("OIDC scopes must include openid");
        for (const value of [
            dto.issuer,
            dto.authorizationUrl,
            dto.tokenUrl,
            dto.userInfoUrl,
            dto.jwksUrl,
            dto.ssoUrl,
        ])
            if (value)
                this.network.assertPublicHttpsUrl(value);
    }
    record(actorId, organizationId, entityId, action, before, after, metadata) {
        return this.audit.record({
            actorId,
            organizationId,
            entityType: "SsoProvider",
            entityId,
            action,
            before,
            after,
            metadata,
        });
    }
    normalizeName(value) {
        return value.trim().toLocaleLowerCase("en-US");
    }
    normalizeRoute(value, kind) {
        const normalized = value
            .trim()
            .toLowerCase()
            .replace(/^\.+|\.+$/g, "");
        if (!normalized ||
            !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(normalized) ||
            (kind === "SUBDOMAIN" && normalized.includes(".")))
            throw new common_1.BadRequestException("Invalid SSO tenant route");
        return normalized;
    }
    text(value) {
        const text = value?.trim();
        return text || null;
    }
    url(value) {
        if (!value)
            return null;
        return this.network.assertPublicHttpsUrl(value).toString();
    }
    list(value, fallback = []) {
        return [
            ...new Set((value ?? fallback).map((item) => item.trim()).filter(Boolean)),
        ];
    }
    translateConflict(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002")
            throw new common_1.ConflictException("SSO provider identifier or tenant route already exists");
        throw error;
    }
};
exports.SsoProviderService = SsoProviderService;
exports.SsoProviderService = SsoProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sso_secret_service_1.SsoSecretService,
        audit_log_service_1.AuditLogService,
        sso_network_security_service_1.SsoNetworkSecurityService])
], SsoProviderService);
//# sourceMappingURL=sso-provider.service.js.map