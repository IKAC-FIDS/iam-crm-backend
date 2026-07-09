import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { SsoProviderType, UserRole } from '@prisma/client';

export class CreateSsoProviderDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(SsoProviderType)
  type!: SsoProviderType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  autoProvision?: boolean;

  @IsOptional()
  @IsEnum(UserRole)
  defaultRole?: UserRole;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  allowedDomains?: string[];

  // OIDC configuration
  @IsOptional()
  @IsUrl({ require_tld: false })
  issuer?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  /**
   * Plain secret is accepted only on write.
   * It must be encrypted into clientSecretEnc and must never be returned.
   */
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  authorizationUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  tokenUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  userInfoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  jwksUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  scopes?: string[];

  // SAML configuration
  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  ssoUrl?: string;

  @IsOptional()
  @IsString()
  x509Certificate?: string;

  @IsOptional()
  @IsBoolean()
  signRequests?: boolean;

  @IsOptional()
  @IsBoolean()
  wantAssertionsSigned?: boolean;

  @IsOptional()
  @IsBoolean()
  wantResponseSigned?: boolean;

  // Attribute mapping
  @IsOptional()
  @IsString()
  emailAttribute?: string;

  @IsOptional()
  @IsString()
  nameAttribute?: string;

  @IsOptional()
  @IsString()
  groupsAttribute?: string;
}