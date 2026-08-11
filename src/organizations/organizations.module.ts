import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PlatformAuthorityModule } from '../platform-authority/platform-authority.module';
import { PlatformOrganizationsController } from './platform-organizations.controller';

@Module({
  imports: [PlatformAuthorityModule],
  controllers: [OrganizationsController, PlatformOrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
