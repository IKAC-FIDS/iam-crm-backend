import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import { RescheduleActivityDto } from './dto/reschedule-activity.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { parseApiDate, parseNullableApiDate } from '../common/dates/api-date.util';
import { CompanyAccessService } from '../companies/company-access.service';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import {
  userTeamFilterWhere,
  userTeamScopeWhere,
} from '../common/tenant/team-scope.util';
import { OwnershipScope } from '../common/dto/ownership-scope.dto';
import { parseApiDateRange } from '../common/dates/api-date.util';
import {
  ActivityListStatus,
  FindActivitiesDto,
} from './dto/find-activities.dto';

const activityCenterSelect = {
  id: true,
  type: true,
  notes: true,
  outcome: true,
  occurredAt: true,
  completedAt: true,
  createdAt: true,
  person: { select: { id: true, fullName: true } },
  company: {
    select: {
      id: true,
      legalName: true,
      brandName: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
          team: true,
          teamId: true,
        },
      },
    },
  },
  user: {
    select: { id: true, fullName: true, email: true },
  },
} satisfies Prisma.ActivitySelect;

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService, private audit: AuditLogService, private companyAccess: CompanyAccessService) {}

  findTypes() {
    return this.prisma.lookupOption.findMany({ where: { group: 'activity-types' }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] });
  }

  private async validateManualType(type: string) {
    if (type === 'STAGE_CHANGE') throw new BadRequestException('STAGE_CHANGE is a system activity');
    const option = await this.prisma.lookupOption.findFirst({ where: { group: 'activity-types', code: type, isActive: true } });
    if (!option) throw new BadRequestException('نوع فعالیت انتخاب‌شده نامعتبر یا غیرفعال است.');
  }

  async findAll(
    query: FindActivitiesDto,
    user: CurrentUserPayload,
  ): Promise<PaginatedResponse<any>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.activityCenterWhere(query, user);
    const primaryOrder: Prisma.ActivityOrderByWithRelationInput =
      query.sortBy === 'createdAt'
        ? { createdAt: query.sortOrder ?? 'desc' }
        : { occurredAt: query.sortOrder ?? 'desc' };
    const orderDirection = query.sortOrder ?? 'desc';
    const orderBy: Prisma.ActivityOrderByWithRelationInput[] =
      query.sortBy === 'createdAt'
        ? [primaryOrder, { id: orderDirection }]
        : [
            primaryOrder,
            { createdAt: orderDirection },
            { id: orderDirection },
          ];
    const [rows, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        select: activityCenterSelect,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      data: rows.map((row) => this.activityCenterRow(row)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async latestActivities(user: CurrentUserPayload) {
    const rows = await this.prisma.activity.findMany({
      where: this.activityCenterWhere({}, user),
      select: activityCenterSelect,
      orderBy: { occurredAt: 'desc' },
      take: 10,
    });
    return rows.map((row) => {
      const mapped = this.activityCenterRow(row);
      return {
        id: mapped.id,
        type: mapped.type,
        title: mapped.title,
        activityDate: mapped.activityDate,
        person: mapped.person,
        company: mapped.company,
        createdBy: mapped.createdBy,
      };
    });
  }

  private activityCenterWhere(
    query: FindActivitiesDto,
    user: CurrentUserPayload,
  ): Prisma.ActivityWhereInput {
    const and: Prisma.ActivityWhereInput[] = [
      {
        company: {
          organizationId: getCurrentOrganizationId(user),
          archivedAt: null,
        },
      },
    ];
    if (query.activityType) and.push({ type: query.activityType });
    if (query.status === ActivityListStatus.COMPLETED) {
      and.push({ completedAt: { not: null } });
    } else if (query.status === ActivityListStatus.RECORDED) {
      and.push({ completedAt: null });
    }
    if (query.ownerId) and.push({ company: { ownerId: query.ownerId } });
    if (query.createdById) and.push({ userId: query.createdById });
    if (query.personId) and.push({ personId: query.personId });
    if (query.companyId) and.push({ companyId: query.companyId });
    const activityDate = parseApiDateRange(
      query.dateFrom,
      query.dateTo,
      'dateFrom',
      'dateTo',
    );
    if (activityDate) and.push({ occurredAt: activityDate });
    if (query.team?.trim()) {
      and.push({ company: { owner: userTeamFilterWhere([query.team]) } });
    }
    if (query.ownershipScope === OwnershipScope.MINE) {
      and.push({ company: { ownerId: user.userId } });
    } else if (query.ownershipScope === OwnershipScope.TEAM) {
      and.push({ company: { owner: userTeamScopeWhere(user) } });
    } else if (query.ownershipScope === OwnershipScope.UNASSIGNED) {
      and.push({ company: { ownerId: null } });
    }
    if (query.mine) and.push({ userId: user.userId });
    if (query.unassigned) and.push({ company: { ownerId: null } });
    const search = query.search?.trim();
    if (search) {
      and.push({
        OR: [
          { outcome: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { person: { fullName: { contains: search, mode: 'insensitive' } } },
          { company: { legalName: { contains: search, mode: 'insensitive' } } },
          { company: { brandName: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }
    return { AND: and };
  }

  private activityCenterRow(
    row: Prisma.ActivityGetPayload<{ select: typeof activityCenterSelect }>,
  ) {
    const { owner, ...company } = row.company;
    return {
      ...row,
      title: row.outcome ?? row.type,
      description: row.notes,
      status: row.completedAt
        ? ActivityListStatus.COMPLETED
        : ActivityListStatus.RECORDED,
      activityDate: row.occurredAt,
      updatedAt: row.createdAt,
      company,
      owner,
      createdBy: row.user,
    };
  }

  // ============================================================
  // متد کمکی: بررسی دسترسی به شرکت
  // ============================================================
  private async validateCompanyAccess(companyId: string, user: CurrentUserPayload) {
    await this.companyAccess.assertCompanyMutable(companyId, user);
  }

  // ============================================================
  // متد کمکی: بررسی دسترسی به مخاطب
  // ============================================================
  private async validatePersonAccess(personId: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, company: { organizationId: getCurrentOrganizationId(user) } },
      include: { company: { select: { ownerId: true, owner: { select: { team: true, teamId: true } } } } },
    });

    if (!person) {
      throw new NotFoundException('مخاطب پیدا نشد');
    }

    // بررسی دسترسی به شرکت مربوطه
    await this.validateCompanyAccess(person.companyId, user);
    return person;
  }

  private async findActivityForMutation(activityId: string, user: CurrentUserPayload) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, company: { organizationId: getCurrentOrganizationId(user) } },
      include: {
        company: true,
        person: true,
        user: { select: { id: true, fullName: true } },
        completedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!activity) throw new NotFoundException('Activity not found');
    await this.validateCompanyAccess(activity.companyId, user);
    return activity;
  }

  // ============================================================
  // ۱. دریافت فعالیت‌های یک شرکت (با صفحه‌بندی + محدودیت دسترسی)
  // ============================================================
  async findByCompany(
    companyId: string,
    pagination: PaginationDto,
    user: CurrentUserPayload,
  ): Promise<PaginatedResponse<any>> {
    if (!companyId) {
      throw new BadRequestException('شناسه شرکت الزامی است');
    }

    await this.assertCompanyReadable(companyId, user);

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { companyId },
        include: { person: true, user: { select: { id: true, fullName: true } } },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where: { companyId } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }
  // ============================================================
  // ۲. ایجاد فعالیت جدید (با بررسی دسترسی)
  // ============================================================
  async create(dto: CreateActivityDto, user: CurrentUserPayload) {
    // بررسی دسترسی به شرکت
    await this.validateCompanyAccess(dto.companyId, user);
    await this.validateManualType(dto.type);

    // اگر personId ارسال شده، بررسی دسترسی به مخاطب
    if (dto.personId) {
      const person = await this.validatePersonAccess(dto.personId, user);
      if (person.companyId !== dto.companyId) {
        throw new BadRequestException('Person must belong to the activity company');
      }
    }
    if (dto.opportunityId) await this.validateOpportunityCompany(dto.opportunityId, dto.companyId);

    const activity = await this.prisma.activity.create({
      data: {
        companyId: dto.companyId,
        personId: dto.personId,
        userId: user.userId,
        type: dto.type,
        notes: dto.notes,
        outcome: dto.outcome,
        occurredAt: dto.occurredAt ? parseApiDate(dto.occurredAt, 'occurredAt') : undefined,
        nextActionDate: dto.nextActionDate ? parseApiDate(dto.nextActionDate, 'nextActionDate') : undefined,
        opportunityId: dto.opportunityId,
      },
    });
    await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activity.id, action: 'activity.created', after: activity });
    return activity;
  }

  private async assertCompanyReadable(
    companyId: string,
    user: CurrentUserPayload,
  ): Promise<void> {
    await this.companyAccess.assertCompanyReadable(companyId, user);
  }

  async updateActivity(activityId: string, dto: UpdateActivityDto, user: CurrentUserPayload) {
    const activity = await this.findActivityForMutation(activityId, user);
    if (dto.type !== undefined && dto.type !== activity.type) await this.validateManualType(dto.type);

    if (activity.type === 'STAGE_CHANGE') {
      throw new BadRequestException('STAGE_CHANGE activities cannot be edited manually');
    }
    if (dto.type === 'STAGE_CHANGE') {
      throw new BadRequestException('Activity type cannot be changed to STAGE_CHANGE manually');
    }
    if (dto.personId) {
      const person = await this.validatePersonAccess(dto.personId, user);
      if (person.companyId !== activity.companyId) {
        throw new BadRequestException('Person must belong to the activity company');
      }
    }
    if (dto.opportunityId) await this.validateOpportunityCompany(dto.opportunityId, activity.companyId);

    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.personId !== undefined && { personId: dto.personId }),
        ...(dto.occurredAt != null && { occurredAt: parseApiDate(dto.occurredAt, 'occurredAt') }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
        ...(dto.nextActionDate !== undefined && {
          nextActionDate: parseNullableApiDate(dto.nextActionDate, 'nextActionDate'),
        }),
        ...(dto.opportunityId !== undefined && { opportunityId: dto.opportunityId }),
      },
      include: { company: true, person: true, user: { select: { id: true, fullName: true } }, completedBy: { select: { id: true, fullName: true } } },
    });
    await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activityId, action: 'activity.updated', before: activity, after: updated });
    return updated;
  }

  async completeActivity(activityId: string, dto: CompleteActivityDto, user: CurrentUserPayload) {
    const activity = await this.findActivityForMutation(activityId, user);
    if (!activity.nextActionDate) {
      throw new BadRequestException('Only activities with a follow-up date can be completed');
    }
    if (activity.completedAt) return activity;

    const completed = await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        completedAt: new Date(),
        completedById: user.userId,
        completionNote: dto.completionNote,
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
      },
      include: { company: true, person: true, user: { select: { id: true, fullName: true } }, completedBy: { select: { id: true, fullName: true } } },
    });
    await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activityId, action: 'follow-up.completed', before: activity, after: completed });
    return completed;
  }

  async rescheduleActivity(activityId: string, dto: RescheduleActivityDto, user: CurrentUserPayload) {
    const activity = await this.findActivityForMutation(activityId, user);
    if (activity.completedAt) {
      throw new BadRequestException('Completed follow-ups cannot be rescheduled');
    }

    const nextActionDate = parseApiDate(dto.nextActionDate, 'nextActionDate');
    if (nextActionDate <= new Date()) {
      throw new BadRequestException('nextActionDate must be in the future');
    }
    const note = dto.note?.trim();
    const notes = note ? [activity.notes, `[Rescheduled] ${note}`].filter(Boolean).join('\n') : activity.notes;

    const rescheduled = await this.prisma.activity.update({
      where: { id: activityId },
      data: { nextActionDate, notes },
      include: { company: true, person: true, user: { select: { id: true, fullName: true } }, completedBy: { select: { id: true, fullName: true } } },
    });
    await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activityId, action: 'follow-up.rescheduled', before: activity, after: rescheduled });
    return rescheduled;
  }

  // ============================================================
  // ۳. دریافت فعالیت‌های سررسید شده (فقط برای کاربر جاری)
  // ============================================================
  async findDueFollowUps(
    user: CurrentUserPayload,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<any>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId: user.userId,
      company: { organizationId: getCurrentOrganizationId(user) },
      nextActionDate: { lte: new Date() },
      completedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: { company: { select: { id: true, legalName: true } }, person: true },
        orderBy: { nextActionDate: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  private async validateOpportunityCompany(opportunityId: string, companyId: string) {
    const opportunity = await this.prisma.opportunity.findFirst({ where: { id: opportunityId, companyId }, select: { companyId: true } });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
  }
}
