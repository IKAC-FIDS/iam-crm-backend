import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SsoProviderType, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import NodeCache from 'node-cache';
import { randomBytes } from 'crypto';
import { Issuer, generators } from 'openid-client';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SsoSecretService } from './sso-secret.service';
import { SsoTicketService } from './sso-ticket.service';

interface OidcStatePayload {
  providerId: string;
  nonce: string;
}

interface ResolvedOidcIdentity {
  subject: string;
  email: string;
  fullName: string;
}

@Injectable()
export class OidcService {
  private readonly stateCache = new NodeCache({
    stdTTL: 300,
    checkperiod: 60,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly secretService: SsoSecretService,
    private readonly ticketService: SsoTicketService,
    private readonly auditLog: AuditLogService,
  ) {}

  async buildAuthorizationUrl(providerId: string): Promise<string> {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.isActive) {
      throw new NotFoundOrInactiveSsoProviderException();
    }

    if (provider.type !== SsoProviderType.OIDC) {
      throw new BadRequestException('SSO provider is not an OIDC provider');
    }

    if (!provider.issuer || !provider.clientId) {
      throw new BadRequestException('OIDC provider is not fully configured');
    }

    const client = await this.createClient(provider);

    const state = generators.state();
    const nonce = generators.nonce();

    this.stateCache.set<OidcStatePayload>(state, {
      providerId: provider.id,
      nonce,
    });

    return client.authorizationUrl({
      scope: this.getScopes(provider.scopes),
      state,
      nonce,
    });
  }

  async handleCallback(
    providerId: string,
    query: Record<string, string>,
  ): Promise<string> {
    const frontendCallbackUrl = this.getFrontendCallbackUrl();

    try {
      const provider = await this.prisma.ssoProvider.findUnique({
        where: { id: providerId },
      });

      if (!provider || !provider.isActive) {
        throw new NotFoundOrInactiveSsoProviderException();
      }

      if (provider.type !== SsoProviderType.OIDC) {
        throw new BadRequestException('SSO provider is not an OIDC provider');
      }

      const state = query.state;
      if (!state) {
        throw new BadRequestException('Missing OIDC state');
      }

      const cached = this.stateCache.get<OidcStatePayload>(state);
      if (!cached || cached.providerId !== provider.id) {
        throw new BadRequestException('Invalid or expired OIDC state');
      }

      this.stateCache.del(state);

      const client = await this.createClient(provider);

      const tokenSet = await client.callback(
        this.getRedirectUri(provider.id),
        query,
        {
          state,
          nonce: cached.nonce,
        },
      );

      const claims = tokenSet.claims();

      const subject = claims.sub;
      if (!subject) {
        throw new UnauthorizedException('OIDC subject is missing');
      }

      let email =
        typeof claims.email === 'string' && claims.email
          ? claims.email
          : undefined;

      let fullName =
        typeof claims.name === 'string' && claims.name
          ? claims.name
          : undefined;

      if (!email || !fullName) {
        const userInfo = await client.userinfo(tokenSet.access_token as string);

        if (!email && typeof userInfo.email === 'string') {
          email = userInfo.email;
        }

        if (!fullName && typeof userInfo.name === 'string') {
          fullName = userInfo.name;
        }
      }

      if (!email) {
        throw new UnauthorizedException('OIDC email is missing');
      }

      const identity: ResolvedOidcIdentity = {
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
    } catch (error) {
      await this.auditLog.record({
        entityType: 'SsoProvider',
        entityId: providerId,
        action: 'sso.oidc.login.failed',
        metadata: {
          message:
            error instanceof Error ? error.message : 'Unknown OIDC login error',
        },
      });

      return this.appendQuery(frontendCallbackUrl, {
        error: 'oidc_login_failed',
      });
    }
  }

  private async createClient(provider: {
    id: string;
    issuer: string | null;
    clientId: string | null;
    clientSecretEnc: string | null;
    scopes: string[];
  }) {
    if (!provider.issuer || !provider.clientId) {
      throw new BadRequestException('OIDC provider is not fully configured');
    }

    const issuer = await Issuer.discover(provider.issuer);

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

  private async resolveOrProvisionUser(
    providerId: string,
    identity: ResolvedOidcIdentity,
  ): Promise<User> {
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
        throw new UnauthorizedException('SSO user is inactive');
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
      throw new UnauthorizedException('SSO auto-provisioning is disabled');
    }

    this.assertAllowedDomain(identity.email, provider.allowedDomains);

    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      10,
    );

    const role = provider.defaultRole ?? UserRole.REP;

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

  private assertAllowedDomain(email: string, allowedDomains: string[]) {
    if (!allowedDomains.length) return;

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      throw new UnauthorizedException('Invalid SSO email domain');
    }

    const normalizedAllowed = allowedDomains.map((item) =>
      item.toLowerCase().trim(),
    );

    if (!normalizedAllowed.includes(domain)) {
      throw new UnauthorizedException('SSO email domain is not allowed');
    }
  }

  private getRedirectUri(providerId: string): string {
    const backendPublicUrl = this.config.get<string>(
      'BACKEND_PUBLIC_URL',
      'http://localhost:3000',
    );

    return `${backendPublicUrl.replace(/\/$/, '')}/api/auth/oidc/${providerId}/callback`;
  }

  private getFrontendCallbackUrl(): string {
    return this.config.get<string>(
      'FRONTEND_SSO_CALLBACK_URL',
      'http://localhost:5173/auth/sso/callback',
    );
  }

  private getScopes(scopes: string[]): string {
    const normalized = scopes?.length
      ? scopes
      : ['openid', 'profile', 'email'];

    return Array.from(new Set(normalized)).join(' ');
  }

  private appendQuery(baseUrl: string, params: Record<string, string>): string {
    const url = new URL(baseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }
}

class NotFoundOrInactiveSsoProviderException extends BadRequestException {
  constructor() {
    super('SSO provider not found or inactive');
  }
}