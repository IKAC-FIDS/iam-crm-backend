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
const sso_secret_service_1 = require("./sso-secret.service");
let SsoProviderService = class SsoProviderService {
    constructor(prisma, secretService, auditLog) {
        this.prisma = prisma;
        this.secretService = secretService;
        this.auditLog = auditLog;
    }
    async listPublicProviders() {
        const providers = await this.prisma.ssoProvider.findMany({
            where: { isActive: true },
            orderBy: [{ name: 'asc' }],
            select: {
                id: true,
                name: true,
                type: true,
            },
        });
        return providers.map(sso_provider_response_dto_1.toPublicSsoProviderResponse);
    }
    async listProviders() {
        const providers = await this.prisma.ssoProvider.findMany({
            orderBy: [{ createdAt: 'desc' }],
        });
        return providers.map(sso_provider_response_dto_1.toSsoProviderResponse);
    }
    async getProvider(id) {
        const provider = await this.prisma.ssoProvider.findUnique({
            where: { id },
        });
        if (!provider) {
            throw new common_1.NotFoundException('SSO provider not found');
        }
        return (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
    }
    async createProvider(dto, actorId) {
        this.validateProviderInput(dto.type, dto);
        const data = this.buildCreateData(dto);
        const provider = await this.prisma.ssoProvider.create({
            data,
        });
        await this.auditLog.record({
            actorId,
            entityType: 'SsoProvider',
            entityId: provider.id,
            action: 'sso.provider.created',
            after: (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider),
        });
        return (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
    }
    async updateProvider(id, dto, actorId) {
        const existing = await this.prisma.ssoProvider.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('SSO provider not found');
        }
        const effectiveType = dto.type ?? existing.type;
        this.validateProviderInput(effectiveType, dto);
        const data = this.buildUpdateData(dto);
        const provider = await this.prisma.ssoProvider.update({
            where: { id },
            data,
        });
        await this.auditLog.record({
            actorId,
            entityType: 'SsoProvider',
            entityId: provider.id,
            action: 'sso.provider.updated',
            before: (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing),
            after: (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider),
        });
        return (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
    }
    async disableProvider(id, actorId) {
        const existing = await this.prisma.ssoProvider.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException('SSO provider not found');
        }
        const provider = await this.prisma.ssoProvider.update({
            where: { id },
            data: { isActive: false },
        });
        await this.auditLog.record({
            actorId,
            entityType: 'SsoProvider',
            entityId: provider.id,
            action: 'sso.provider.disabled',
            before: (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing),
            after: (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider),
        });
        return (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
    }
    async deleteProvider(id, actorId) {
        const existing = await this.prisma.ssoProvider.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        externalIdentities: true,
                        loginTickets: true,
                    },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('SSO provider not found');
        }
        if (existing._count.externalIdentities > 0 ||
            existing._count.loginTickets > 0) {
            const provider = await this.prisma.ssoProvider.update({
                where: { id },
                data: { isActive: false },
            });
            await this.auditLog.record({
                actorId,
                entityType: 'SsoProvider',
                entityId: provider.id,
                action: 'sso.provider.disabled',
                before: (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing),
                after: (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider),
                metadata: {
                    reason: 'Provider has linked external identities or login tickets',
                },
            });
            return (0, sso_provider_response_dto_1.toSsoProviderResponse)(provider);
        }
        const deletedResponse = (0, sso_provider_response_dto_1.toSsoProviderResponse)(existing);
        await this.prisma.ssoProvider.delete({
            where: { id },
        });
        await this.auditLog.record({
            actorId,
            entityType: 'SsoProvider',
            entityId: id,
            action: 'sso.provider.deleted',
            before: deletedResponse,
        });
        return deletedResponse;
    }
    buildCreateData(dto) {
        return {
            name: dto.name.trim(),
            type: dto.type,
            isActive: dto.isActive ?? true,
            autoProvision: dto.autoProvision ?? false,
            defaultRole: dto.defaultRole,
            allowedDomains: this.normalizeList(dto.allowedDomains),
            issuer: this.normalizeOptionalString(dto.issuer),
            clientId: this.normalizeOptionalString(dto.clientId),
            clientSecretEnc: dto.clientSecret
                ? this.secretService.encryptSecret(dto.clientSecret)
                : undefined,
            authorizationUrl: this.normalizeOptionalString(dto.authorizationUrl),
            tokenUrl: this.normalizeOptionalString(dto.tokenUrl),
            userInfoUrl: this.normalizeOptionalString(dto.userInfoUrl),
            jwksUrl: this.normalizeOptionalString(dto.jwksUrl),
            scopes: dto.type === client_1.SsoProviderType.OIDC
                ? this.normalizeList(dto.scopes, ['openid', 'profile', 'email'])
                : [],
            entityId: this.normalizeOptionalString(dto.entityId),
            ssoUrl: this.normalizeOptionalString(dto.ssoUrl),
            x509Certificate: this.normalizeOptionalString(dto.x509Certificate),
            signRequests: dto.signRequests ?? false,
            wantAssertionsSigned: dto.wantAssertionsSigned ?? true,
            wantResponseSigned: dto.wantResponseSigned ?? false,
            emailAttribute: this.normalizeOptionalString(dto.emailAttribute),
            nameAttribute: this.normalizeOptionalString(dto.nameAttribute),
            groupsAttribute: this.normalizeOptionalString(dto.groupsAttribute),
        };
    }
    buildUpdateData(dto) {
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.autoProvision !== undefined)
            data.autoProvision = dto.autoProvision;
        if (dto.defaultRole !== undefined)
            data.defaultRole = dto.defaultRole;
        if (dto.allowedDomains !== undefined) {
            data.allowedDomains = this.normalizeList(dto.allowedDomains);
        }
        if (dto.issuer !== undefined) {
            data.issuer = this.normalizeOptionalString(dto.issuer);
        }
        if (dto.clientId !== undefined) {
            data.clientId = this.normalizeOptionalString(dto.clientId);
        }
        if (dto.clientSecret !== undefined) {
            data.clientSecretEnc = dto.clientSecret
                ? this.secretService.encryptSecret(dto.clientSecret)
                : null;
        }
        if (dto.authorizationUrl !== undefined) {
            data.authorizationUrl = this.normalizeOptionalString(dto.authorizationUrl);
        }
        if (dto.tokenUrl !== undefined) {
            data.tokenUrl = this.normalizeOptionalString(dto.tokenUrl);
        }
        if (dto.userInfoUrl !== undefined) {
            data.userInfoUrl = this.normalizeOptionalString(dto.userInfoUrl);
        }
        if (dto.jwksUrl !== undefined) {
            data.jwksUrl = this.normalizeOptionalString(dto.jwksUrl);
        }
        if (dto.scopes !== undefined) {
            data.scopes = this.normalizeList(dto.scopes, [
                'openid',
                'profile',
                'email',
            ]);
        }
        if (dto.entityId !== undefined) {
            data.entityId = this.normalizeOptionalString(dto.entityId);
        }
        if (dto.ssoUrl !== undefined) {
            data.ssoUrl = this.normalizeOptionalString(dto.ssoUrl);
        }
        if (dto.x509Certificate !== undefined) {
            data.x509Certificate = this.normalizeOptionalString(dto.x509Certificate);
        }
        if (dto.signRequests !== undefined) {
            data.signRequests = dto.signRequests;
        }
        if (dto.wantAssertionsSigned !== undefined) {
            data.wantAssertionsSigned = dto.wantAssertionsSigned;
        }
        if (dto.wantResponseSigned !== undefined) {
            data.wantResponseSigned = dto.wantResponseSigned;
        }
        if (dto.emailAttribute !== undefined) {
            data.emailAttribute = this.normalizeOptionalString(dto.emailAttribute);
        }
        if (dto.nameAttribute !== undefined) {
            data.nameAttribute = this.normalizeOptionalString(dto.nameAttribute);
        }
        if (dto.groupsAttribute !== undefined) {
            data.groupsAttribute = this.normalizeOptionalString(dto.groupsAttribute);
        }
        return data;
    }
    validateProviderInput(type, dto) {
        if (dto.name !== undefined && !dto.name.trim()) {
            throw new common_1.BadRequestException('SSO provider name is required');
        }
        if (type === client_1.SsoProviderType.OIDC) {
            if (dto.scopes && !dto.scopes.includes('openid')) {
                throw new common_1.BadRequestException('OIDC scopes must include openid');
            }
        }
    }
    normalizeOptionalString(value) {
        if (value === undefined || value === null)
            return null;
        const trimmed = value.trim();
        return trimmed || null;
    }
    normalizeList(value, fallback = []) {
        const source = value ?? fallback;
        return Array.from(new Set(source
            .map((item) => item.trim())
            .filter(Boolean)));
    }
};
exports.SsoProviderService = SsoProviderService;
exports.SsoProviderService = SsoProviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sso_secret_service_1.SsoSecretService,
        audit_log_service_1.AuditLogService])
], SsoProviderService);
//# sourceMappingURL=sso-provider.service.js.map