import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { FindUsersDto } from './dto/find-users.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  team: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // ۱. ایجاد کاربر جدید
  // ============================================================
  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        team: dto.team,
      },
    });
    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  }

  // ============================================================
  // ۲. دریافت لیست کاربران
  // ============================================================
  async findAll(query: FindUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.team?.trim() && { team: query.team.trim() }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    };
  }

  getOwnerOptions(user: CurrentUserPayload) {
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('You do not have access to owner options');
    }
    const teamScope: Prisma.UserWhereInput = user.role === UserRole.MANAGER
      ? user.team ? { team: user.team } : { id: { in: [] } }
      : {};
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [UserRole.REP, UserRole.MANAGER] },
        ...teamScope,
      },
      select: { id: true, fullName: true, email: true, role: true, team: true, isActive: true },
      orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
    });
  }

  // ============================================================
  // ۳. دریافت یک کاربر
  // ============================================================
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
    return user;
  }

  // ============================================================
  // ۴. غیرفعال کردن کاربر
  // ============================================================
  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
      },
    });
  }

// ============================================================
// ✅ ۵. فعال‌سازی مجدد کاربر
// ============================================================
async activate(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundException('کاربر پیدا نشد');
  }

  if (user.isActive) {
    throw new BadRequestException('کاربر قبلاً فعال است');
  }

  return this.prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      team: true,
      isActive: true,
    },
  });
}

  // ============================================================
  // ✅ ۶. تغییر نقش یک کاربر
  // ============================================================
  async updateUserRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { ownedCompanies: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد');
    }

    // اگر کاربر شرکت‌هایی دارد و نقش جدید MANAGER است، بررسی تیم
    if (dto.role === UserRole.MANAGER && user.ownedCompanies.length > 0 && !dto.team) {
      throw new BadRequestException('برای تبدیل به MANAGER، باید تیم مشخص شود');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role,
        team: dto.team ?? user.team,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
      },
    });

    // پاک کردن کش دسترسی‌ها (چون نقش تغییر کرده)
    PermissionsGuard.clearCache(dto.role);
    PermissionsGuard.clearCache(user.role);

    return updatedUser;
  }
}
