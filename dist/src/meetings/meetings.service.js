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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const api_date_util_1 = require("../common/dates/api-date.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const meetingInclude = {
    company: { select: { id: true, legalName: true, brandName: true } },
    opportunity: { select: { id: true, title: true, companyId: true } },
    organizer: { select: { id: true, fullName: true, email: true } },
    createdBy: { select: { id: true, fullName: true, email: true } },
    completedBy: { select: { id: true, fullName: true, email: true } },
    cancelledBy: { select: { id: true, fullName: true, email: true } },
    assignees: { include: { user: { select: { id: true, fullName: true, email: true, role: true, teamId: true } } } },
    attendees: { include: { person: { select: { id: true, fullName: true, title: true, companyId: true } } } },
};
let MeetingsService = class MeetingsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(query, user) {
        const page = query.page ?? 1, limit = query.limit ?? 20;
        const where = this.buildWhere(query, user);
        const [data, total] = await Promise.all([
            this.prisma.meeting.findMany({ where, include: meetingInclude, skip: (page - 1) * limit, take: limit, orderBy: { startAt: query.upcoming ? 'asc' : 'desc' } }),
            this.prisma.meeting.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    async findOne(id, user) { return this.get(id, user); }
    async create(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const values = await this.validate(dto, organizationId);
        const meeting = await this.prisma.$transaction(async (tx) => tx.meeting.create({
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
    async update(id, dto, user) {
        const current = await this.get(id, user);
        if (current.status !== client_1.MeetingStatus.SCHEDULED)
            throw new common_1.BadRequestException('Only scheduled meetings can be updated');
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const merged = {
            companyId: dto.companyId ?? current.companyId, opportunityId: dto.opportunityId === undefined ? current.opportunityId ?? undefined : dto.opportunityId,
            startAt: dto.startAt ?? current.startAt.toISOString(), endAt: dto.endAt ?? current.endAt.toISOString(),
            reminderAt: dto.reminderAt === undefined ? current.reminderAt?.toISOString() : dto.reminderAt,
            assigneeUserIds: dto.assigneeUserIds, attendeePersonIds: dto.attendeePersonIds,
        };
        const values = await this.validate(merged, organizationId);
        const updated = await this.prisma.$transaction(async (tx) => {
            if (dto.assigneeUserIds) {
                await tx.meetingAssignee.deleteMany({ where: { meetingId: id } });
                await tx.meetingAssignee.createMany({ data: dto.assigneeUserIds.map(userId => ({ meetingId: id, userId, assignedById: user.userId })) });
            }
            if (dto.attendeePersonIds) {
                await tx.meetingAttendee.deleteMany({ where: { meetingId: id } });
                await tx.meetingAttendee.createMany({ data: dto.attendeePersonIds.map(personId => ({ meetingId: id, personId })) });
            }
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
        if (dto.assigneeUserIds)
            await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.assignees_changed' });
        if (dto.attendeePersonIds)
            await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.attendees_changed' });
        return updated;
    }
    async complete(id, dto, user) {
        const current = await this.get(id, user);
        if (current.status === client_1.MeetingStatus.COMPLETED)
            return current;
        if (current.status !== client_1.MeetingStatus.SCHEDULED)
            throw new common_1.BadRequestException('Cancelled meeting cannot be completed');
        const updated = await this.prisma.meeting.update({ where: { id }, data: { status: client_1.MeetingStatus.COMPLETED, completedAt: new Date(), completedById: user.userId, completionNote: dto.completionNote?.trim() || null }, include: meetingInclude });
        await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.completed', before: current, after: updated });
        return updated;
    }
    async cancel(id, dto, user) {
        const current = await this.get(id, user);
        if (current.status === client_1.MeetingStatus.CANCELLED)
            return current;
        if (current.status !== client_1.MeetingStatus.SCHEDULED)
            throw new common_1.BadRequestException('Completed meeting cannot be cancelled');
        const updated = await this.prisma.meeting.update({ where: { id }, data: { status: client_1.MeetingStatus.CANCELLED, cancelledAt: new Date(), cancelledById: user.userId, cancellationReason: dto.cancellationReason?.trim() || null }, include: meetingInclude });
        await this.audit.record({ actorId: user.userId, entityType: 'meeting', entityId: id, action: 'meeting.cancelled', before: current, after: updated });
        return updated;
    }
    buildWhere(q, user) {
        const now = new Date();
        const and = [{ organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) }];
        if (q.companyId)
            and.push({ companyId: q.companyId });
        if (q.opportunityId)
            and.push({ opportunityId: q.opportunityId });
        if (q.organizerId)
            and.push({ organizerId: q.organizerId });
        if (q.assignedUserId)
            and.push({ assignees: { some: { userId: q.assignedUserId } } });
        if (q.attendeePersonId)
            and.push({ attendees: { some: { personId: q.attendeePersonId } } });
        if (q.status)
            and.push({ status: q.status });
        if (q.mode)
            and.push({ mode: q.mode });
        const range = (0, api_date_util_1.parseApiDateRange)(q.dateFrom, q.dateTo, 'dateFrom', 'dateTo');
        if (range)
            and.push({ startAt: range });
        if (q.upcoming)
            and.push({ startAt: { gte: now } });
        if (q.past)
            and.push({ startAt: { lt: now } });
        if (q.mine)
            and.push({ OR: [{ organizerId: user.userId }, { assignees: { some: { userId: user.userId } } }] });
        if (q.reminderDue)
            and.push({ status: client_1.MeetingStatus.SCHEDULED, reminderAt: { lte: now }, reminderSentAt: null });
        const s = q.search?.trim();
        if (s)
            and.push({ OR: [{ title: { contains: s, mode: 'insensitive' } }, { agenda: { contains: s, mode: 'insensitive' } }, { company: { legalName: { contains: s, mode: 'insensitive' } } }, { company: { brandName: { contains: s, mode: 'insensitive' } } }, { opportunity: { title: { contains: s, mode: 'insensitive' } } }] });
        return { AND: and };
    }
    async get(id, user) { const value = await this.prisma.meeting.findFirst({ where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) }, include: meetingInclude }); if (!value)
        throw new common_1.NotFoundException('Meeting not found'); return value; }
    title(value) { const v = value.trim(); if (!v)
        throw new common_1.BadRequestException('Meeting title is required'); return v; }
    async validate(dto, organizationId) {
        const startAt = (0, api_date_util_1.parseApiDate)(dto.startAt, 'startAt'), endAt = (0, api_date_util_1.parseApiDate)(dto.endAt, 'endAt'), reminderAt = dto.reminderAt ? (0, api_date_util_1.parseApiDate)(dto.reminderAt, 'reminderAt') : undefined;
        if (endAt <= startAt)
            throw new common_1.BadRequestException('endAt must be after startAt');
        if (reminderAt && reminderAt >= startAt)
            throw new common_1.BadRequestException('reminderAt must be before startAt');
        if (reminderAt && startAt > new Date() && reminderAt < new Date())
            throw new common_1.BadRequestException('Reminder for a future meeting cannot be in the past');
        const company = await this.prisma.company.findFirst({ where: { id: dto.companyId, organizationId }, select: { id: true } });
        if (!company)
            throw new common_1.BadRequestException('Invalid company');
        if (dto.opportunityId) {
            const o = await this.prisma.opportunity.findFirst({ where: { id: dto.opportunityId, organizationId }, select: { companyId: true } });
            if (!o || o.companyId !== dto.companyId)
                throw new common_1.BadRequestException('Opportunity must belong to the meeting company');
        }
        const users = [...new Set(dto.assigneeUserIds ?? [])];
        if (users.length) {
            const count = await this.prisma.user.count({ where: { id: { in: users }, organizationId, isActive: true } });
            if (count !== users.length)
                throw new common_1.BadRequestException('One or more assignees are invalid');
        }
        const people = [...new Set(dto.attendeePersonIds ?? [])];
        if (people.length) {
            const count = await this.prisma.person.count({ where: { id: { in: people }, companyId: dto.companyId, company: { organizationId } } });
            if (count !== people.length)
                throw new common_1.BadRequestException('One or more attendees do not belong to the meeting company');
        }
        return { startAt, endAt, reminderAt };
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map