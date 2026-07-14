import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import NodeCache from 'node-cache';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PERMISSIONS_KEY,
  PermissionPolicyMetadata,
} from '../decorators/permissions.decorator';

const cache = new NodeCache({ stdTTL: 600 });

type RequestUser = {
  userId?: string;
  email?: string;
  role?: string;
  team?: string | null;
  teamId?: string | null;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policy = this.reflector.getAllAndOverride<
      PermissionPolicyMetadata | string[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    const normalizedPolicy = this.normalizePolicy(policy);

    if (!normalizedPolicy || normalizedPolicy.actions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const requestUser = request.user as RequestUser | undefined;

    if (!requestUser?.userId) {
      throw new ForbiddenException('کاربر احراز هویت نشده است');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: requestUser.userId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      throw new ForbiddenException('حساب کاربری فعال نیست');
    }

    const userPermissions = await this.getPermissionsForRole(dbUser.role);

    const allowed =
      normalizedPolicy.mode === 'any'
        ? normalizedPolicy.actions.some((permission) =>
            userPermissions.has(permission),
          )
        : normalizedPolicy.actions.every((permission) =>
            userPermissions.has(permission),
          );

    if (!allowed) {
      const missingPermissions = normalizedPolicy.actions.filter(
        (permission) => !userPermissions.has(permission),
      );

      throw new ForbiddenException(
        `شما دسترسی لازم برای این عملیات را ندارید: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private normalizePolicy(
    policy: PermissionPolicyMetadata | string[] | undefined,
  ): PermissionPolicyMetadata | null {
    if (!policy) {
      return null;
    }

    if (Array.isArray(policy)) {
      return {
        actions: policy,
        mode: 'all',
      };
    }

    return {
      actions: policy.actions ?? [],
      mode: policy.mode ?? 'all',
    };
  }

  private async getPermissionsForRole(role: UserRole): Promise<Set<string>> {
    const cacheKey = `permissions:${role}`;
    let permissions = cache.get<string[]>(cacheKey);

    if (!permissions) {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { role },
        include: { permission: true },
      });

      permissions = rolePermissions.map((rp) => rp.permission.action);
      cache.set(cacheKey, permissions);
    }

    return new Set(permissions);
  }

  static clearCache(role?: UserRole | string) {
    if (role) {
      cache.del(`permissions:${role}`);
      return;
    }

    cache.flushAll();
  }
}
