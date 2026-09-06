import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingReminderService } from './meeting-reminder.service';
import { MeetingsService } from './meetings.service';
import { EmailModule } from '../email/email.module';

@Module({ imports: [EmailModule], controllers: [MeetingsController], providers: [MeetingsService, MeetingReminderService], exports: [MeetingsService] })
export class MeetingsModule {}
