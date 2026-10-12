import { Module } from '@nestjs/common';
import { CustomerRequestsService } from './customer-requests.service';
import { InternalRequestsController, InternalRequestTypesController, PortalRequestsController, PortalRequestTypesController } from './customer-requests.controller';

@Module({ providers: [CustomerRequestsService], controllers: [InternalRequestTypesController, PortalRequestTypesController, PortalRequestsController, InternalRequestsController], exports: [CustomerRequestsService] })
export class CustomerRequestsModule {}
