import { Module } from '@nestjs/common';
import { PipelineConfigModule } from '../admin/pipeline/pipeline-config.module';
import { CompanyOpportunitiesController } from './company-opportunities.controller';
import { OpportunityLineItemsController } from './opportunity-line-items.controller';
import { OpportunityLineItemsService } from './opportunity-line-items.service';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({
  imports: [PipelineConfigModule],
  controllers: [
    OpportunitiesController,
    CompanyOpportunitiesController,
    OpportunityLineItemsController,
  ],
  providers: [
    OpportunitiesService,
    OpportunityLineItemsService,
  ],
  exports: [
    OpportunitiesService,
  ],
})
export class OpportunitiesModule {}