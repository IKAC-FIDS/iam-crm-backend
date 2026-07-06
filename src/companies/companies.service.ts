import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PipelineStage, Priority, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ChangeStageDto } from './dto/change-stage.dto';
import { ChangeOwnerDto, BulkChangeOwnerDto } from './dto/change-owner.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // ۱. دریافت لیست شرکت‌ها (با فیلترهای پیشرفته + صفحه‌بندی)
  // ============================================================
  async findAll(
    user: CurrentUserPayload,
    pagination: PaginationDto,
    filters?: {
      stage?: PipelineStage;
      priority?: Priority;
      withoutOwner?: boolean;
      search?: string;
      ownerId?: string;
    },
  ): Promise<PaginatedResponse<any>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    let where: Prisma.CompanyWhereInput = {};

    // ============================================================
    // دسترسی بر اساس نقش
    // ============================================================
    if (user.role === UserRole.REP) {
      // فروشنده: فقط شرکت‌های خودش
      where.ownerId = user.userId;
    } else if (user.role === UserRole.MANAGER) {
      // مدیر فروش: فقط شرکت‌های تیم خودش
      if (user.team) {
        where.owner = { team: user.team };
      } else {
        // اگر MANAGER تیم ندارد، هیچ شرکتی نبیند
        where = { id: { in: [] } };
      }
    } else if (user.role === UserRole.BOARDS) {
      // کاربر BOARDS: هیچ شرکتی را نمی‌بیند
      where = { id: { in: [] } };
    }
    // ADMIN: همه شرکت‌ها، where خالی می‌ماند

    // ============================================================
    // فیلترهای اضافی
    // نکته مهم:
    // این فیلترها نباید داخل Object.keys(where).length باشند،
    // چون برای ADMIN مقدار where در ابتدا خالی است و فیلترها اعمال نمی‌شوند.
    // ============================================================

    if (filters?.withoutOwner && user.role !== UserRole.REP) {
      where.ownerId = null;
    }

    if (filters?.stage) {
      where.stage = filters.stage;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.ownerId) {
      // REP نباید بتواند با ownerId از scope خودش خارج شود
      if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
        where.ownerId = filters.ownerId;
      }
    }

    if (filters?.search?.trim()) {
      const search = filters.search.trim();

      where.OR = [
        { legalName: { contains: search } },
        { brandName: { contains: search } },
        { industry: { contains: search } },
        { headOfficeCity: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              team: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where }),
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
  // ۲. دریافت یک شرکت
  // ============================================================
  async findOne(id: string, user: CurrentUserPayload) {
    // جلوگیری از دسترسی BOARDS به شرکت‌ها
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما دسترسی به شرکت‌ها را ندارید');
    }

    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, team: true } },
        people: true,
        branches: true,
        socialChannels: true,
        callCard: true,
        activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
        stageHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    if (!company) throw new NotFoundException('شرکت پیدا نشد');

    this.assertAccess(company, user);

    return company;
  }

  // ============================================================
  // ۳. ایجاد شرکت جدید
  // ============================================================
  async create(dto: CreateCompanyDto, user: CurrentUserPayload) {
    // جلوگیری از ایجاد شرکت توسط BOARDS
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما اجازه ایجاد شرکت را ندارید');
    }

    return this.prisma.company.create({
      data: {
        ...dto,
        ownerId: dto.ownerId ?? user.userId,
      },
    });
  }

  // ============================================================
  // ۴. ویرایش شرکت
  // ============================================================
  async update(id: string, dto: UpdateCompanyDto, user: CurrentUserPayload) {
    // جلوگیری از ویرایش توسط BOARDS
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما اجازه ویرایش شرکت را ندارید');
    }

    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) throw new NotFoundException('شرکت پیدا نشد');

    this.assertAccess(company, user);

    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================================
  // ۵. تغییر مرحله پایپ‌لاین
  // ============================================================
  async changeStage(id: string, dto: ChangeStageDto, user: CurrentUserPayload) {
    // جلوگیری از تغییر مرحله توسط BOARDS
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما اجازه تغییر مرحله شرکت را ندارید');
    }

    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) throw new NotFoundException('شرکت پیدا نشد');

    this.assertAccess(company, user);

    const [updated] = await this.prisma.$transaction([
      this.prisma.company.update({
        where: { id },
        data: { stage: dto.stage },
      }),
      this.prisma.pipelineStageHistory.create({
        data: {
          companyId: id,
          fromStage: company.stage,
          toStage: dto.stage,
          changedById: user.userId,
        },
      }),
    ]);

    return updated;
  }

  // ============================================================
  // ۶. تغییر مالکیت یک شرکت
  // ============================================================
  async changeOwner(
    id: string,
    dto: ChangeOwnerDto,
    user: CurrentUserPayload,
  ) {
    // جلوگیری از تغییر مالکیت توسط BOARDS
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما اجازه تغییر مالکیت شرکت را ندارید');
    }

    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!company) throw new NotFoundException('شرکت پیدا نشد');

    await this.assertChangeOwnerAccess(company, user);

    const newOwner = await this.prisma.user.findUnique({
      where: { id: dto.newOwnerId },
    });

    if (!newOwner) throw new NotFoundException('کاربر جدید پیدا نشد');

    if (newOwner.role !== UserRole.REP && newOwner.role !== UserRole.MANAGER) {
      throw new BadRequestException('کاربر جدید باید نقش REP یا MANAGER داشته باشد');
    }

    if (newOwner.role === UserRole.MANAGER) {
      const companyTeam = company.owner?.team;

      if (companyTeam && newOwner.team !== companyTeam) {
        throw new BadRequestException('مدیر فروش باید در همان تیم شرکت باشد');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: { ownerId: dto.newOwnerId },
    });
  }

  // ============================================================
  // ۷. تغییر مالکیت گروهی شرکت‌ها
  // ============================================================
  async bulkChangeOwner(
    dto: BulkChangeOwnerDto,
    user: CurrentUserPayload,
  ) {
    // جلوگیری از تغییر مالکیت گروهی توسط BOARDS
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما اجازه تغییر مالکیت گروهی شرکت‌ها را ندارید');
    }

    const newOwner = await this.prisma.user.findUnique({
      where: { id: dto.newOwnerId },
    });

    if (!newOwner) throw new NotFoundException('کاربر جدید پیدا نشد');

    if (newOwner.role !== UserRole.REP && newOwner.role !== UserRole.MANAGER) {
      throw new BadRequestException('کاربر جدید باید نقش REP یا MANAGER داشته باشد');
    }

    const companies = await this.prisma.company.findMany({
      where: { id: { in: dto.companyIds } },
      include: { owner: true },
    });

    if (companies.length === 0) {
      throw new BadRequestException('هیچ شرکتی با این شناسه‌ها پیدا نشد');
    }

    for (const company of companies) {
      await this.assertChangeOwnerAccess(company, user);
    }

    if (newOwner.role === UserRole.MANAGER) {
      for (const company of companies) {
        const companyTeam = company.owner?.team;

        if (companyTeam && newOwner.team !== companyTeam) {
          throw new BadRequestException(
            `شرکت ${company.legalName} در تیم ${companyTeam} است اما مدیر جدید در تیم ${newOwner.team} است`,
          );
        }
      }
    }

    const result = await this.prisma.company.updateMany({
      where: { id: { in: dto.companyIds } },
      data: { ownerId: dto.newOwnerId },
    });

    return {
      message: `${result.count} شرکت با موفقیت به کاربر ${newOwner.fullName} اختصاص یافت`,
      updatedCount: result.count,
    };
  }

  // ============================================================
  // ۸. متد کمکی: بررسی دسترسی عمومی
  // ============================================================
  private assertAccess(
    company: { ownerId: string | null },
    user: CurrentUserPayload,
  ) {
    // BOARDS قبلاً در متدهای جداگانه بررسی شده، اما برای اطمینان:
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما دسترسی به شرکت‌ها را ندارید');
    }

    if (user.role === UserRole.REP && company.ownerId !== user.userId) {
      throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
    }

    // MANAGER و ADMIN دسترسی کامل دارند
  }

  // ============================================================
  // ۹. متد کمکی: بررسی دسترسی تغییر مالکیت
  // ============================================================
  private async assertChangeOwnerAccess(
    company: any,
    user: CurrentUserPayload,
  ) {
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما اجازه تغییر مالکیت شرکت را ندارید');
    }

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.MANAGER) {
      if (!company.ownerId) {
        throw new ForbiddenException('فقط ادمین می‌تواند مالکیت شرکت‌های بدون مالک را تغییر دهد');
      }

      const companyTeam = company.owner?.team;

      if (!companyTeam || companyTeam !== user.team) {
        throw new ForbiddenException('شما فقط می‌توانید شرکت‌های تیم خود را تغییر دهید');
      }

      return;
    }

    throw new ForbiddenException('شما اجازه تغییر مالکیت شرکت‌ها را ندارید');
  }
}