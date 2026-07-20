import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingReminderService } from './meeting-reminder.service';
import { MeetingsService } from './meetings.service';

@Module({ controllers: [MeetingsController], providers: [MeetingsService, MeetingReminderService], exports: [MeetingsService] })
export class MeetingsModule {}
