import { Module } from '@nestjs/common';
import { CustomerAccessModule } from '../customer-access/customer-access.module';
import { EmailModule } from '../email/email.module';
import { CustomerUsersService } from './customer-users.service';
import { InternalCustomerUsersController, PortalCustomerUsersController } from './customer-users.controller';

@Module({ imports: [CustomerAccessModule, EmailModule], providers: [CustomerUsersService], controllers: [InternalCustomerUsersController, PortalCustomerUsersController], exports: [CustomerUsersService] })
export class CustomerUsersModule {}
