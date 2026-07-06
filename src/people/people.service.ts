import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // ۱. دریافت مخاطبین یک شرکت (با صفحه‌بندی + محدودیت دسترسی)
  // ============================================================
  async findByCompany(
    companyId: string | undefined,  // ← تغییر نوع به string | undefined
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
      this.prisma.person.findMany({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.person.count({ where: { companyId } }),
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
  // ۲. دریافت یک مخاطب (با بررسی دسترسی)
  // ============================================================
  async findOne(id: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
      company: true,
      contacts: true,  // ← اضافه شد
      socials: true,   // ← اضافه شد
      },
    });
    if (!person) throw new NotFoundException('مخاطب پیدا نشد');

    await this.validateCompanyAccess(person.companyId, user);
    return person;
  }

  // ============================================================
  // ۳. ایجاد مخاطب جدید (با بررسی دسترسی)
  // ============================================================
  async create(dto: CreatePersonDto, user: CurrentUserPayload) {
    await this.validateCompanyAccess(dto.companyId, user);

    const { contacts, socials, ...personData } = dto;

    return this.prisma.person.create({
      data: {
        ...personData,
        contacts: {
          create: contacts?.map(c => ({
            type: c.type,
            value: c.value,
            isPrimary: c.isPrimary || false,
            note: c.note,
          })) || [],
        },
        socials: {
          create: socials?.map(s => ({
            platform: s.platform,
            handle: s.handle,
            isPrimary: s.isPrimary || false,
            note: s.note,
          })) || [],
        },
      },
      include: {
        contacts: true,
        socials: true,
      },
    });
  }

  // ============================================================
  // ۴. ویرایش مخاطب (با بررسی دسترسی)
  // ============================================================
  async update(id: string, dto: UpdatePersonDto, user: CurrentUserPayload) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!person) throw new NotFoundException('مخاطب پیدا نشد');

    await this.validateCompanyAccess(person.companyId, user);

    return this.prisma.person.update({
      where: { id },
      data: dto,
    });
  }

  // ============================================================
  // ۵. حذف مخاطب (با بررسی دسترسی)
  // ============================================================
  async remove(id: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!person) throw new NotFoundException('مخاطب پیدا نشد');

    await this.validateCompanyAccess(person.companyId, user);

    return this.prisma.person.delete({
      where: { id },
    });
  }

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

    // ADMIN: دسترسی کامل
    if (user.role === UserRole.ADMIN) return;

    // MANAGER: فقط شرکت‌های تیم خودش
    if (user.role === UserRole.MANAGER) {
      const companyTeam = company.owner?.team;
      if (!companyTeam || companyTeam !== user.team) {
        throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
      }
      return;
    }

    // REP: فقط شرکت‌های خودش
    if (user.role === UserRole.REP && company.ownerId !== user.userId) {
      throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
    }

    // BOARDS: دسترسی به مخاطبین ندارد
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما دسترسی به مخاطبین را ندارید');
    }
  }
}