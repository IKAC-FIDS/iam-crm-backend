import { Module } from '@nestjs/common';
import { PipelineConfigModule } from '../admin/pipeline/pipeline-config.module';
import { CompanyOpportunitiesController } from './company-opportunities.controller';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({ imports: [PipelineConfigModule], controllers: [OpportunitiesController, CompanyOpportunitiesController], providers: [OpportunitiesService], exports: [OpportunitiesService] })
export class OpportunitiesModule {}
