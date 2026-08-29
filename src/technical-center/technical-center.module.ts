import { Module } from '@nestjs/common';
import {
  TechnicalDocumentsController,
  TechnicalKnowledgeController,
  TechnicalReleasesController,
  TechnicalResourcesController,
  TechnicalTendersController,
} from './technical-center.controller';
import { TechnicalCenterService } from './technical-center.service';

@Module({
  controllers: [
    TechnicalReleasesController,
    TechnicalKnowledgeController,
    TechnicalDocumentsController,
    TechnicalResourcesController,
    TechnicalTendersController,
  ],
  providers: [TechnicalCenterService],
  exports: [TechnicalCenterService],
})
export class TechnicalCenterModule {}
