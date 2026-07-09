import { Controller, Get } from '@nestjs/common';
import { SsoProviderService } from './sso-provider.service';

@Controller('auth/sso')
export class SsoPublicController {
  constructor(private readonly service: SsoProviderService) {}

  @Get('providers')
  listProviders() {
    return this.service.listPublicProviders();
  }
}