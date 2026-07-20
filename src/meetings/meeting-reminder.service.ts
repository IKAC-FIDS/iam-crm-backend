import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MeetingStatus, NotificationEntityType, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingReminderService {
  private readonly logger = new Logger(MeetingReminderService.name);
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * * *')
  async processDueReminders() {
    try {
      await this.prisma.$transaction(async tx => {
        const locked = await tx.$queryRaw<Array<{ locked: boolean }>>(Prisma.sql`SELECT pg_try_advisory_xact_lock(73644291) AS locked`);
        if (!locked[0]?.locked) return;
        const due = await tx.meeting.findMany({ where: { status: MeetingStatus.SCHEDULED, reminderAt: { lte: new Date() }, reminderSentAt: null }, include: { assignees: { select: { userId: true } } }, take: 100, orderBy: { reminderAt: 'asc' } });
        for (const meeting of due) {
          const recipientIds = [...new Set([meeting.organizerId, ...meeting.assignees.map(a => a.userId)])];
          await tx.notification.createMany({ data: recipientIds.map(recipientId => ({ organizationId: meeting.organizationId, recipientId, type: NotificationType.MEETING_REMINDER, title: 'یادآوری جلسه', body: `جلسه «${meeting.title}» در تاریخ ${meeting.startAt.toISOString()} برگزار می‌شود.`, entityType: NotificationEntityType.MEETING, entityId: meeting.id, actionUrl: `/meetings/${meeting.id}` })) });
          await tx.meeting.update({ where: { id: meeting.id }, data: { reminderSentAt: new Date() } });
          await tx.auditLog.create({ data: { organizationId: meeting.organizationId, entityType: 'meeting', entityId: meeting.id, action: 'meeting.reminder_sent', metadata: { recipientCount: recipientIds.length } } });
        }
      }, { timeout: 30000 });
    } catch (error) { this.logger.error('Meeting reminder processing failed', error instanceof Error ? error.stack : undefined); }
  }
}
