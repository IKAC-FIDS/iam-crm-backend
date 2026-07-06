import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';

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
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // ۳. دریافت یک کاربر
  // ============================================================
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        team: true,
        isActive: true,
      },
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