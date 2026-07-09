import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SsoProviderType } from '@prisma/client';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSsoProviderDto } from './dto/create-sso-provider.dto';
import {
  PublicSsoProviderResponseDto,
  SsoProviderResponseDto,
  toPublicSsoProviderResponse,
  toSsoProviderResponse,
} from './dto/sso-provider-response.dto';
import { UpdateSsoProviderDto } from './dto/update-sso-provider.dto';
import { SsoSecretService } from './sso-secret.service';

@Injectable()
export class SsoProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secretService: SsoSecretService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listPublicProviders(): Promise<PublicSsoProviderResponseDto[]> {
    const providers = await this.prisma.ssoProvider.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    return providers.map(toPublicSsoProviderResponse);
  }

  async listProviders(): Promise<SsoProviderResponseDto[]> {
    const providers = await this.prisma.ssoProvider.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });

    return providers.map(toSsoProviderResponse);
  }

  async getProvider(id: string): Promise<SsoProviderResponseDto> {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found');
    }

    return toSsoProviderResponse(provider);
  }

  async createProvider(
    dto: CreateSsoProviderDto,
    actorId?: string,
  ): Promise<SsoProviderResponseDto> {
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
      after: toSsoProviderResponse(provider),
    });

    return toSsoProviderResponse(provider);
  }

  async updateProvider(
    id: string,
    dto: UpdateSsoProviderDto,
    actorId?: string,
  ): Promise<SsoProviderResponseDto> {
    const existing = await this.prisma.ssoProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('SSO provider not found');
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
      before: toSsoProviderResponse(existing),
      after: toSsoProviderResponse(provider),
    });

    return toSsoProviderResponse(provider);
  }

  async disableProvider(
    id: string,
    actorId?: string,
  ): Promise<SsoProviderResponseDto> {
    const existing = await this.prisma.ssoProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('SSO provider not found');
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
      before: toSsoProviderResponse(existing),
      after: toSsoProviderResponse(provider),
    });

    return toSsoProviderResponse(provider);
  }

  async deleteProvider(
    id: string,
    actorId?: string,
  ): Promise<SsoProviderResponseDto> {
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
      throw new NotFoundException('SSO provider not found');
    }

    if (
      existing._count.externalIdentities > 0 ||
      existing._count.loginTickets > 0
    ) {
      const provider = await this.prisma.ssoProvider.update({
        where: { id },
        data: { isActive: false },
      });

      await this.auditLog.record({
        actorId,
        entityType: 'SsoProvider',
        entityId: provider.id,
        action: 'sso.provider.disabled',
        before: toSsoProviderResponse(existing),
        after: toSsoProviderResponse(provider),
        metadata: {
          reason: 'Provider has linked external identities or login tickets',
        },
      });

      return toSsoProviderResponse(provider);
    }

    const deletedResponse = toSsoProviderResponse(existing);

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

  private buildCreateData(dto: CreateSsoProviderDto): Prisma.SsoProviderCreateInput {
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
      scopes:
        dto.type === SsoProviderType.OIDC
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

  private buildUpdateData(dto: UpdateSsoProviderDto): Prisma.SsoProviderUpdateInput {
    const data: Prisma.SsoProviderUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.autoProvision !== undefined) data.autoProvision = dto.autoProvision;
    if (dto.defaultRole !== undefined) data.defaultRole = dto.defaultRole;
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

  private validateProviderInput(
    type: SsoProviderType,
    dto: CreateSsoProviderDto | UpdateSsoProviderDto,
  ) {
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('SSO provider name is required');
    }

    if (type === SsoProviderType.OIDC) {
      if (dto.scopes && !dto.scopes.includes('openid')) {
        throw new BadRequestException('OIDC scopes must include openid');
      }
    }
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (value === undefined || value === null) return null;

    const trimmed = value.trim();
    return trimmed || null;
  }

  private normalizeList(value?: string[], fallback: string[] = []): string[] {
    const source = value ?? fallback;

    return Array.from(
      new Set(
        source
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    );
  }
}