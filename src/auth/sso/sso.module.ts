import { Module } from '@nestjs/common';
import { AuthModule } from '../auth.module';
import { OidcController } from './oidc.controller';
import { OidcService } from './oidc.service';
import { SsoAdminController } from './sso-admin.controller';
import { SsoExchangeController } from './sso-exchange.controller';
import { SsoPublicController } from './sso-public.controller';
import { SsoProviderService } from './sso-provider.service';
import { SsoSecretService } from './sso-secret.service';
import { SsoTicketService } from './sso-ticket.service';
import { SamlController } from './saml.controller';
import { SamlService } from './saml.service';

@Module({
  imports: [AuthModule],
  controllers: [
    SsoPublicController,
    SsoAdminController,
    OidcController,
    SamlController,
    SsoExchangeController,
  ],
  providers: [
    SsoProviderService,
    SsoSecretService,
    SsoTicketService,
    OidcService,
    SamlService,
  ],
  exports: [
    SsoProviderService,
    SsoSecretService,
    SsoTicketService,
    OidcService,
    SamlService,
  ],
})
export class SsoModule {}