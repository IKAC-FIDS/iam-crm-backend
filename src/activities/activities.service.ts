import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.activity.create({
      data: {
        companyId: dto.companyId,
        personId: dto.personId,
        userId: user.userId,
        type: dto.type,
        notes: dto.notes,
        outcome: dto.outcome,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        nextActionDate: dto.nextActionDate ? new Date(dto.nextActionDate) : undefined,
      },
    });
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
}