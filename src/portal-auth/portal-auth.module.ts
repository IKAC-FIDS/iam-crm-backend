import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerAccessModule } from '../customer-access/customer-access.module';
import { RefreshTokenService } from '../auth/refresh-token.service';
import { PortalAuthController } from './portal-auth.controller';
import { PortalAuthService } from './portal-auth.service';

@Module({
  imports: [CustomerAccessModule, JwtModule.registerAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.get<string>('JWT_SECRET') }) })],
  controllers: [PortalAuthController],
  providers: [PortalAuthService, RefreshTokenService],
  exports: [PortalAuthService],
})
export class PortalAuthModule {}
