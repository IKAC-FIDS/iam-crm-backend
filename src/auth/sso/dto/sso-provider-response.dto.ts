import { SsoProvider, SsoProviderType, UserRole } from '@prisma/client';

export interface SsoProviderResponseDto {
  id: string;
  name: string;
  type: SsoProviderType;
  isActive: boolean;

  autoProvision: boolean;
  defaultRole: UserRole | null;
  allowedDomains: string[];

  issuer: string | null;
  clientId: string | null;
  authorizationUrl: string | null;
  tokenUrl: string | null;
  userInfoUrl: string | null;
  jwksUrl: string | null;
  scopes: string[];

  entityId: string | null;
  ssoUrl: string | null;
  x509Certificate: string | null;
  signRequests: boolean;
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;

  emailAttribute: string | null;
  nameAttribute: string | null;
  groupsAttribute: string | null;

  hasClientSecret: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface PublicSsoProviderResponseDto {
  id: string;
  name: string;
  type: SsoProviderType;
}

export function toSsoProviderResponse(
  provider: SsoProvider,
): SsoProviderResponseDto {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    isActive: provider.isActive,

    autoProvision: provider.autoProvision,
    defaultRole: provider.defaultRole,
    allowedDomains: provider.allowedDomains,

    issuer: provider.issuer,
    clientId: provider.clientId,
    authorizationUrl: provider.authorizationUrl,
    tokenUrl: provider.tokenUrl,
    userInfoUrl: provider.userInfoUrl,
    jwksUrl: provider.jwksUrl,
    scopes: provider.scopes,

    entityId: provider.entityId,
    ssoUrl: provider.ssoUrl,
    x509Certificate: provider.x509Certificate,
    signRequests: provider.signRequests,
    wantAssertionsSigned: provider.wantAssertionsSigned,
    wantResponseSigned: provider.wantResponseSigned,

    emailAttribute: provider.emailAttribute,
    nameAttribute: provider.nameAttribute,
    groupsAttribute: provider.groupsAttribute,

    hasClientSecret: Boolean(provider.clientSecretEnc),

    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export function toPublicSsoProviderResponse(
  provider: Pick<SsoProvider, 'id' | 'name' | 'type'>,
): PublicSsoProviderResponseDto {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
  };
}