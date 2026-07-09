import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SAML } from '@node-saml/node-saml';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Prisma, SsoProvider, SsoProviderType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SsoTicketService } from './sso-ticket.service';

type SamlProfile = Record<string, unknown> & {
  nameID?: string;
  nameId?: string;
  issuer?: string;
  sessionIndex?: string;
};

@Injectable()
export class SamlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ssoTicketService: SsoTicketService,
  ) {}

  async buildLoginUrl(providerId: string): Promise<string> {
    const provider = await this.getActiveSamlProvider(providerId);
    const saml = this.createSamlClient(provider);

    return saml.getAuthorizeUrlAsync('', undefined, {});
  }

  async handleAcs(
    providerId: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const provider = await this.getActiveSamlProvider(providerId);

    if (!body?.SAMLResponse) {
      throw new BadRequestException('Missing SAMLResponse');
    }

    const saml = this.createSamlClient(provider);

    const result = await saml.validatePostResponseAsync(
      body as Record<string, string>,
    );

    const profile = result.profile as SamlProfile | undefined;

    if (!profile) {
      throw new BadRequestException('Invalid SAML response profile');
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

    const frontendCallbackUrl = this.config.get<string>(
      'FRONTEND_SSO_CALLBACK_URL',
    );

    if (!frontendCallbackUrl) {
      throw new InternalServerErrorException(
        'Frontend SSO callback URL is not configured',
      );
    }

    const url = new URL(frontendCallbackUrl);
    url.searchParams.set('ticket', ticket);
    url.searchParams.set('providerId', provider.id);
    url.searchParams.set('type', 'SAML');

    return url.toString();
  }

  async generateMetadata(providerId: string): Promise<string> {
    const provider = await this.getActiveSamlProvider(providerId);
    const saml = this.createSamlClient(provider);

    return saml.generateServiceProviderMetadata(null, null);
  }

  private async getActiveSamlProvider(providerId: string): Promise<SsoProvider> {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.isActive || provider.type !== SsoProviderType.SAML) {
      throw new NotFoundException('Active SAML provider not found');
    }

    return provider;
  }

  private createSamlClient(provider: SsoProvider): SAML {
    const callbackUrl = this.getAcsUrl(provider.id);
    const issuer = provider.entityId || this.getEntityId(provider.id);

    if (!provider.ssoUrl) {
      throw new BadRequestException('SAML provider SSO URL is not configured');
    }

    if (!provider.x509Certificate) {
      throw new BadRequestException(
        'SAML provider X.509 certificate is not configured',
      );
    }

    return new SAML({
      callbackUrl,
      entryPoint: provider.ssoUrl,
      issuer,
      audience: issuer,
      idpCert: this.normalizeCertificate(provider.x509Certificate),
      identifierFormat:
        'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      signatureAlgorithm: 'sha256',
      digestAlgorithm: 'sha256',
      wantAssertionsSigned: provider.wantAssertionsSigned,
      wantAuthnResponseSigned: provider.wantResponseSigned,
//       validateInResponseTo: 'never',
      acceptedClockSkewMs: 120000,
      disableRequestedAuthnContext: true,
    });
  }

  private getBackendPublicUrl(): string {
    const value = this.config.get<string>('BACKEND_PUBLIC_URL');

    if (!value) {
      throw new InternalServerErrorException(
        'BACKEND_PUBLIC_URL is not configured',
      );
    }

    return value.replace(/\/$/, '');
  }

  private getAcsUrl(providerId: string): string {
    return `${this.getBackendPublicUrl()}/api/auth/saml/${providerId}/acs`;
  }

  private getEntityId(providerId: string): string {
    return `${this.getBackendPublicUrl()}/api/auth/saml/${providerId}/metadata`;
  }

  private normalizeCertificate(value: string): string {
    const trimmed = value.trim();

    if (trimmed.includes('BEGIN CERTIFICATE')) {
      return trimmed;
    }

    const body = trimmed.replace(/\s+/g, '');
    const rows = body.match(/.{1,64}/g)?.join('\n') ?? body;

    return `-----BEGIN CERTIFICATE-----\n${rows}\n-----END CERTIFICATE-----`;
  }

  private extractSubject(profile: SamlProfile): string {
    const subject = profile.nameID || profile.nameId;

    if (!subject || typeof subject !== 'string') {
      throw new BadRequestException('SAML subject NameID is missing');
    }

    return subject;
  }

  private extractEmail(provider: SsoProvider, profile: SamlProfile): string {
    const configured = this.getStringAttribute(profile, provider.emailAttribute);

    const fallback =
      configured ||
      this.getStringAttribute(profile, 'email') ||
      this.getStringAttribute(profile, 'mail') ||
      this.getStringAttribute(
        profile,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      ) ||
      this.getStringAttribute(profile, 'urn:oid:0.9.2342.19200300.100.1.3') ||
      profile.nameID ||
      profile.nameId;

    if (!fallback || typeof fallback !== 'string') {
      throw new BadRequestException('SAML email attribute is missing');
    }

    return fallback.toLowerCase();
  }

  private extractFullName(
    provider: SsoProvider,
    profile: SamlProfile,
    email: string,
  ): string {
    return (
      this.getStringAttribute(profile, provider.nameAttribute) ||
      this.getStringAttribute(profile, 'displayName') ||
      this.getStringAttribute(profile, 'name') ||
      this.getStringAttribute(
        profile,
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      ) ||
      email
    );
  }

  private getStringAttribute(
    profile: SamlProfile,
    key?: string | null,
  ): string | undefined {
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

  private async resolveUser(
    provider: SsoProvider,
    input: {
      subject: string;
      email: string;
      fullName: string;
    },
  ) {
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
        throw new BadRequestException('User is inactive');
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
        throw new BadRequestException('User is inactive');
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
      throw new BadRequestException('User is not provisioned');
    }

    this.assertAllowedDomain(provider, input.email);

    const role = provider.defaultRole || UserRole.REP;

    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      12,
    );

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

  private assertAllowedDomain(provider: SsoProvider, email: string): void {
    if (!provider.allowedDomains.length) {
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase();

    if (!domain || !provider.allowedDomains.includes(domain)) {
      throw new BadRequestException('Email domain is not allowed');
    }
  }
}