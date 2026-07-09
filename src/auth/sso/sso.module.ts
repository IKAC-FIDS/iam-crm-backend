import { Module } from '@nestjs/common';
import { SsoAdminController } from './sso-admin.controller';
import { SsoPublicController } from './sso-public.controller';
import { SsoProviderService } from './sso-provider.service';
import { SsoSecretService } from './sso-secret.service';
import { SsoTicketService } from './sso-ticket.service';

@Module({
  controllers: [SsoPublicController, SsoAdminController],
  providers: [SsoProviderService, SsoSecretService, SsoTicketService],
  exports: [SsoProviderService, SsoSecretService, SsoTicketService],
})
export class SsoModule {}