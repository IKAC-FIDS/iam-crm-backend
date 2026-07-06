import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import { RescheduleActivityDto } from './dto/reschedule-activity.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService, private audit: AuditLogService) {}

  // ============================================================
  // متد کمکی: بررسی دسترسی به شرکت
  // ============================================================
  private async validateCompanyAccess(companyId: string, user: CurrentUserPayload) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true, owner: { select: { team: true } } },
    });

    if (!company) {
      throw new NotFoundException('شرکت پیدا نشد');
    }

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.MANAGER) {
      const companyTeam = company.owner?.team;
      if (!companyTeam || companyTeam !== user.team) {
        throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
      }
      return;
    }

    if (user.role === UserRole.REP && company.ownerId !== user.userId) {
      throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
    }

    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما دسترسی به فعالیت‌ها را ندارید');
    }
  }

  // ============================================================
  // متد کمکی: بررسی دسترسی به مخاطب
  // ============================================================
  private async validatePersonAccess(personId: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: { company: { select: { ownerId: true, owner: { select: { team: true } } } } },
    });

    if (!person) {
      throw new NotFoundException('مخاطب پیدا نشد');
    }

    // بررسی دسترسی به شرکت مربوطه
    await this.validateCompanyAccess(person.companyId, user);
    return person;
  }

  private async findActivityForMutation(activityId: string, user: CurrentUserPayload) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
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

    await this.validateCompanyAccess(companyId, user);

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

    // اگر personId ارسال شده، بررسی دسترسی به مخاطب
    if (dto.personId) {
      await this.validatePersonAccess(dto.personId, user);
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
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        nextActionDate: dto.nextActionDate ? new Date(dto.nextActionDate) : undefined,
        opportunityId: dto.opportunityId,
      },
    });
    await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activity.id, action: 'activity.created', after: activity });
    return activity;
  }

  async updateActivity(activityId: string, dto: UpdateActivityDto, user: CurrentUserPayload) {
    const activity = await this.findActivityForMutation(activityId, user);

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
        ...(dto.occurredAt != null && { occurredAt: new Date(dto.occurredAt) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
        ...(dto.nextActionDate !== undefined && {
          nextActionDate: dto.nextActionDate === null ? null : new Date(dto.nextActionDate),
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

    const nextActionDate = new Date(dto.nextActionDate);
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
    // BOARDS نباید به این بخش دسترسی داشته باشد
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما دسترسی به فعالیت‌ها را ندارید');
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId: user.userId,
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
    const opportunity = await this.prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { companyId: true } });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    if (opportunity.companyId !== companyId) throw new BadRequestException('Opportunity must belong to the activity company');
  }
}
