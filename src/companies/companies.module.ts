import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { PipelineConfigModule } from '../admin/pipeline/pipeline-config.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { CompanyLegalDocumentsController } from './company-legal-documents.controller';
import { CompanyLegalDocumentsService } from './company-legal-documents.service';
import { QuotaModule } from '../quota/quota.module';
import { CompanyOverviewController } from './company-overview.controller';
import { CompanyOverviewService } from './company-overview.service';
import { ProfileMediaModule } from '../profile-media/profile-media.module';
import { CompanyRegistryLookupService } from './company-registry-lookup.service';

@Module({
  imports: [PipelineConfigModule, AttachmentsModule, QuotaModule, ProfileMediaModule],
  providers: [
    CompaniesService,
    CompanyLegalDocumentsService,
    CompanyOverviewService,
    CompanyRegistryLookupService,
  ],
  controllers: [
    CompaniesController,
    CompanyLegalDocumentsController,
    CompanyOverviewController,
  ],
  exports: [CompaniesService, CompanyOverviewService],
})
export class CompaniesModule {}
