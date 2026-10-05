import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { NotificationCoreModule } from '../notification-core/notification-core.module';
import { TasksModule } from '../tasks/tasks.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { CompaniesModule } from '../companies/companies.module';
import { ConversationReferenceOptionsService } from './conversation-reference-options.service';
import { ConversationAccessService } from './conversation-access.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [
    TasksModule,
    ActivitiesModule,
    OpportunitiesModule,
    MeetingsModule,
    NotificationCoreModule,
    AuditLogModule,
    CollaborationModule,
    AttachmentsModule,
    CompaniesModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationAccessService, ConversationReferenceOptionsService, ConversationsService],
})
export class ConversationsModule {}
