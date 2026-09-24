import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { TasksModule } from '../tasks/tasks.module';
import { CrmAssistantController } from './crm-assistant.controller';
import { CrmAssistantService } from './crm-assistant.service';
import { CrmAssistantToolsService } from './crm-assistant-tools.service';
import { CrmMcpController } from './crm-mcp.controller';
import { CrmAssistantActionsService } from './crm-assistant-actions.service';
import { ActivitiesModule } from '../activities/activities.module';
import { PeopleModule } from '../people/people.module';
import { TimesheetsModule } from '../timesheets/timesheets.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [CompaniesModule, OpportunitiesModule, TasksModule, MeetingsModule, ActivitiesModule, PeopleModule, TimesheetsModule, ReportsModule],
  controllers: [CrmAssistantController, CrmMcpController],
  providers: [CrmAssistantService, CrmAssistantToolsService, CrmAssistantActionsService],
})
export class CrmAssistantModule {}
