"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MeetingReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let MeetingReminderService = MeetingReminderService_1 = class MeetingReminderService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MeetingReminderService_1.name);
    }
    async processDueReminders() {
        try {
            await this.prisma.$transaction(async (tx) => {
                const locked = await tx.$queryRaw(client_1.Prisma.sql `SELECT pg_try_advisory_xact_lock(73644291) AS locked`);
                if (!locked[0]?.locked)
                    return;
                const due = await tx.meeting.findMany({ where: { status: client_1.MeetingStatus.SCHEDULED, reminderAt: { lte: new Date() }, reminderSentAt: null }, include: { assignees: { select: { userId: true } } }, take: 100, orderBy: { reminderAt: 'asc' } });
                for (const meeting of due) {
                    const recipientIds = [...new Set([meeting.organizerId, ...meeting.assignees.map(a => a.userId)])];
                    await tx.notification.createMany({ data: recipientIds.map(recipientId => ({ organizationId: meeting.organizationId, recipientId, type: client_1.NotificationType.MEETING_REMINDER, title: 'یادآوری جلسه', body: `جلسه «${meeting.title}» در تاریخ ${meeting.startAt.toISOString()} برگزار می‌شود.`, entityType: client_1.NotificationEntityType.MEETING, entityId: meeting.id, actionUrl: `/meetings/${meeting.id}` })) });
                    await tx.meeting.update({ where: { id: meeting.id }, data: { reminderSentAt: new Date() } });
                    await tx.auditLog.create({ data: { organizationId: meeting.organizationId, entityType: 'meeting', entityId: meeting.id, action: 'meeting.reminder_sent', metadata: { recipientCount: recipientIds.length } } });
                }
            }, { timeout: 30000 });
        }
        catch (error) {
            this.logger.error('Meeting reminder processing failed', error instanceof Error ? error.stack : undefined);
        }
    }
};
exports.MeetingReminderService = MeetingReminderService;
__decorate([
    (0, schedule_1.Cron)('0 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MeetingReminderService.prototype, "processDueReminders", null);
exports.MeetingReminderService = MeetingReminderService = MeetingReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeetingReminderService);
//# sourceMappingURL=meeting-reminder.service.js.map