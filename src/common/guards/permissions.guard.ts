import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // ۱۰ دقیقه کش

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('کاربر احراز هویت نشده است');
    }

    const userPermissions = await this.getPermissionsForRole(user.role);
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.has(perm),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `شما دسترسی لازم برای این عملیات را ندارید: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private async getPermissionsForRole(role: string): Promise<Set<string>> {
    const cacheKey = `permissions:${role}`;
    let permissions = cache.get<string[]>(cacheKey);

    if (!permissions) {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { role: role as any },
        include: { permission: true },
      });
      permissions = rolePermissions.map((rp) => rp.permission.action);
      cache.set(cacheKey, permissions);
    }

    return new Set(permissions);
  }

  // ✅ متد کمکی برای پاک کردن کش (در سرویس مدیریت استفاده می‌شود)
  static clearCache(role?: string) {
    if (role) {
      cache.del(`permissions:${role}`);
    } else {
      cache.flushAll();
    }
  }
}