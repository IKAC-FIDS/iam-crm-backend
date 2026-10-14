import { Module } from '@nestjs/common';
import { CustomerRequestsService } from './customer-requests.service';
import { CustomerRequestOperationsService } from './customer-request-operations.service';
import { InternalRequestsController, InternalRequestTypesController, PortalRequestsController, PortalRequestTypesController } from './customer-requests.controller';
import { TasksModule } from '../tasks/tasks.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { TechnicalCenterModule } from '../technical-center/technical-center.module';

@Module({ imports: [TasksModule, OpportunitiesModule, TechnicalCenterModule], providers: [CustomerRequestsService, CustomerRequestOperationsService], controllers: [InternalRequestTypesController, PortalRequestTypesController, PortalRequestsController, InternalRequestsController], exports: [CustomerRequestsService, CustomerRequestOperationsService] })
export class CustomerRequestsModule {}
