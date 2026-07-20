import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeetingStatus, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { parseApiDate, parseApiDateRange } from '../common/dates/api-date.util';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { CancelMeetingDto } from './dto/cancel-meeting.dto';
import { CompleteMeetingDto } from './dto/complete-meeting.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { FindMeetingsDto } from './dto/find-meetings.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

const meetingInclude = {
  company: { select: { id: true, legalName: true, brandName: true } },
  opportunity: { select: { id: true, title: true, companyId: true } },
  organizer: { select: { id: true, fullName: true, email: true } },
  createdBy: { select: { id: true, fullName: true, email: true } },
  completedBy: { select: { id: true, fullName: true, email: true } },
  cancelledBy: { select: { id: true, fullName: true, email: true } },
  assignees: { include: { user: { select: { id: true, fullName: true, email: true, role: true, teamId: true } } } },
  attendees: { include: { person: { select: { id: true, fullName: true, title: true, companyId: true } } } },
} satisfies Prisma.MeetingInclude;

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogService) {}

  async findAll(query: FindMeetingsDto, user: CurrentUserPayload) {
    const page = query.page ?? 1, limit = query.limit ?? 20;
    const where = this.buildWhere(query, user);
    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({ where, include: meetingInclude, skip: (page - 1) * limit, take: limit, orderBy: { startAt: query.upcoming ? 'asc' : 'desc' } }),
      this.prisma.meeting.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
  }

  async findOne(id: string, user: CurrentUserPayload) { return this.get(id, user); }

  async create(dto: CreateMeetingDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const values = await this.validate(dto, organizationId);
    const meeting = await this.prisma.$transaction(async tx => tx.meeting.create({
      data: {
        organizationId, companyId: dto.companyId, opportunityId: dto.opportunityId,
        title: this.title(dto.title), agenda: dto.agenda?.trim() || undefined, description: dto.description?.trim() || undefined,
        mode: dto.mode, location: dto.location?.trim() || undefined, meetingUrl: dto.meetingUrl,
        ...values, organizerId: user.userId, createdById: user.userId,
        assignees: { create: (dto.assigneeUserIds ?? []).map(userId => ({ userId, assignedById: user.userId })) },
        attendees: { create: (dto.attendeePersonIds ?? []).map(personId => ({ personId })) },
      }, include: meetingInclude,
    }));
    await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: meeting.id, action: 'meeting.created', after: meeting });
    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto, user: CurrentUserPayload) {
    const current = await this.get(id, user);
    if (current.status !== MeetingStatus.SCHEDULED) throw new BadRequestException('Only scheduled meetings can be updated');
    const organizationId = getCurrentOrganizationId(user);
    const merged = {
      companyId: dto.companyId ?? current.companyId, opportunityId: dto.opportunityId === undefined ? current.opportunityId ?? undefined : dto.opportunityId,
      startAt: dto.startAt ?? current.startAt.toISOString(), endAt: dto.endAt ?? current.endAt.toISOString(),
      reminderAt: dto.reminderAt === undefined ? current.reminderAt?.toISOString() : dto.reminderAt,
      assigneeUserIds: dto.assigneeUserIds, attendeePersonIds: dto.attendeePersonIds,
    };
    const values = await this.validate(merged, organizationId);
    const updated = await this.prisma.$transaction(async tx => {
      if (dto.assigneeUserIds) { await tx.meetingAssignee.deleteMany({ where: { meetingId: id } }); await tx.meetingAssignee.createMany({ data: dto.assigneeUserIds.map(userId => ({ meetingId: id, userId, assignedById: user.userId })) }); }
      if (dto.attendeePersonIds) { await tx.meetingAttendee.deleteMany({ where: { meetingId: id } }); await tx.meetingAttendee.createMany({ data: dto.attendeePersonIds.map(personId => ({ meetingId: id, personId })) }); }
      return tx.meeting.update({ where: { id }, data: {
        ...(dto.companyId !== undefined && { companyId: dto.companyId }), ...(dto.opportunityId !== undefined && { opportunityId: dto.opportunityId || null }),
        ...(dto.title !== undefined && { title: this.title(dto.title) }), ...(dto.agenda !== undefined && { agenda: dto.agenda?.trim() || null }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }), ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.location !== undefined && { location: dto.location?.trim() || null }), ...(dto.meetingUrl !== undefined && { meetingUrl: dto.meetingUrl || null }),
        ...(dto.startAt !== undefined && { startAt: values.startAt }), ...(dto.endAt !== undefined && { endAt: values.endAt }),
        ...(dto.reminderAt !== undefined && { reminderAt: values.reminderAt ?? null, reminderSentAt: null }),
      }, include: meetingInclude });
    });
    await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.updated', before: current, after: updated });
    if (dto.assigneeUserIds) await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.assignees_changed' });
    if (dto.attendeePersonIds) await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.attendees_changed' });
    return updated;
  }

  async complete(id: string, dto: CompleteMeetingDto, user: CurrentUserPayload) {
    const current = await this.get(id, user);
    if (current.status === MeetingStatus.COMPLETED) return current;
    if (current.status !== MeetingStatus.SCHEDULED) throw new BadRequestException('Cancelled meeting cannot be completed');
    const updated = await this.prisma.meeting.update({ where: { id }, data: { status: MeetingStatus.COMPLETED, completedAt: new Date(), completedById: user.userId, completionNote: dto.completionNote?.trim() || null }, include: meetingInclude });
    await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.completed', before: current, after: updated }); return updated;
  }

  async cancel(id: string, dto: CancelMeetingDto, user: CurrentUserPayload) {
    const current = await this.get(id, user);
    if (current.status === MeetingStatus.CANCELLED) return current;
    if (current.status !== MeetingStatus.SCHEDULED) throw new BadRequestException('Completed meeting cannot be cancelled');
    const updated = await this.prisma.meeting.update({ where: { id }, data: { status: MeetingStatus.CANCELLED, cancelledAt: new Date(), cancelledById: user.userId, cancellationReason: dto.cancellationReason?.trim() || null }, include: meetingInclude });
    await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.cancelled', before: current, after: updated }); return updated;
  }

  private buildWhere(q: FindMeetingsDto, user: CurrentUserPayload): Prisma.MeetingWhereInput {
    const now = new Date(); const and: Prisma.MeetingWhereInput[] = [{ organizationId: getCurrentOrganizationId(user) }];
    if (q.companyId) and.push({ companyId: q.companyId }); if (q.opportunityId) and.push({ opportunityId: q.opportunityId });
    if (q.organizerId) and.push({ organizerId: q.organizerId }); if (q.assignedUserId) and.push({ assignees: { some: { userId: q.assignedUserId } } });
    if (q.attendeePersonId) and.push({ attendees: { some: { personId: q.attendeePersonId } } }); if (q.status) and.push({ status: q.status }); if (q.mode) and.push({ mode: q.mode });
    const range = parseApiDateRange(q.dateFrom, q.dateTo, 'dateFrom', 'dateTo'); if (range) and.push({ startAt: range });
    if (q.upcoming) and.push({ startAt: { gte: now } }); if (q.past) and.push({ startAt: { lt: now } });
    if (q.mine) and.push({ OR: [{ organizerId: user.userId }, { assignees: { some: { userId: user.userId } } }] });
    if (q.reminderDue) and.push({ status: MeetingStatus.SCHEDULED, reminderAt: { lte: now }, reminderSentAt: null });
    const s = q.search?.trim(); if (s) and.push({ OR: [{ title: { contains: s, mode: 'insensitive' } }, { agenda: { contains: s, mode: 'insensitive' } }, { company: { legalName: { contains: s, mode: 'insensitive' } } }, { company: { brandName: { contains: s, mode: 'insensitive' } } }, { opportunity: { title: { contains: s, mode: 'insensitive' } } }] });
    return { AND: and };
  }

  private async get(id: string, user: CurrentUserPayload) { const value = await this.prisma.meeting.findFirst({ where: { id, organizationId: getCurrentOrganizationId(user) }, include: meetingInclude }); if (!value) throw new NotFoundException('Meeting not found'); return value; }
  private title(value: string) { const v = value.trim(); if (!v) throw new BadRequestException('Meeting title is required'); return v; }
  private async validate(dto: { companyId: string; opportunityId?: string; startAt: string; endAt: string; reminderAt?: string; assigneeUserIds?: string[]; attendeePersonIds?: string[] }, organizationId: string) {
    const startAt = parseApiDate(dto.startAt, 'startAt'), endAt = parseApiDate(dto.endAt, 'endAt'), reminderAt = dto.reminderAt ? parseApiDate(dto.reminderAt, 'reminderAt') : undefined;
    if (endAt <= startAt) throw new BadRequestException('endAt must be after startAt');
    if (reminderAt && reminderAt >= startAt) throw new BadRequestException('reminderAt must be before startAt');
    if (reminderAt && startAt > new Date() && reminderAt < new Date()) throw new BadRequestException('Reminder for a future meeting cannot be in the past');
    const company = await this.prisma.company.findFirst({ where: { id: dto.companyId, organizationId }, select: { id: true } }); if (!company) throw new BadRequestException('Invalid company');
    if (dto.opportunityId) { const o = await this.prisma.opportunity.findFirst({ where: { id: dto.opportunityId, organizationId }, select: { companyId: true } }); if (!o || o.companyId !== dto.companyId) throw new BadRequestException('Opportunity must belong to the meeting company'); }
    const users = [...new Set(dto.assigneeUserIds ?? [])]; if (users.length) { const count = await this.prisma.user.count({ where: { id: { in: users }, organizationId, isActive: true } }); if (count !== users.length) throw new BadRequestException('One or more assignees are invalid'); }
    const people = [...new Set(dto.attendeePersonIds ?? [])]; if (people.length) { const count = await this.prisma.person.count({ where: { id: { in: people }, companyId: dto.companyId, company: { organizationId } } }); if (count !== people.length) throw new BadRequestException('One or more attendees do not belong to the meeting company'); }
    return { startAt, endAt, reminderAt };
  }
}
