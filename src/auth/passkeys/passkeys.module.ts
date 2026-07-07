import { Module } from '@nestjs/common';
import { AuthModule } from '../auth.module';
import {
  AdminUserPasskeysController,
  AuthPasskeysController,
  MyPasskeysController,
} from './passkeys.controller';
import { PasskeysService } from './passkeys.service';

@Module({
  imports: [AuthModule],
  controllers: [MyPasskeysController, AuthPasskeysController, AdminUserPasskeysController],
  providers: [PasskeysService],
})
export class PasskeysModule {}
