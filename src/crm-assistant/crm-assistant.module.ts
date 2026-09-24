import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { TasksModule } from '../tasks/tasks.module';
import { CrmAssistantController } from './crm-assistant.controller';
import { CrmAssistantService } from './crm-assistant.service';
import { CrmAssistantToolsService } from './crm-assistant-tools.service';
import { CrmMcpController } from './crm-mcp.controller';

@Module({
  imports: [CompaniesModule, OpportunitiesModule, TasksModule, MeetingsModule],
  controllers: [CrmAssistantController, CrmMcpController],
  providers: [CrmAssistantService, CrmAssistantToolsService],
})
export class CrmAssistantModule {}
