import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomerRole } from '@prisma/client';
import { PORTAL_ROLES_KEY } from './portal-roles.decorator';
import type { PortalPrincipal } from './portal-principal';

@Injectable()
export class PortalRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<CustomerRole[]>(PORTAL_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const principal = context.switchToHttp().getRequest().user as PortalPrincipal | undefined;
    if (!principal || !roles.includes(principal.role)) {
      throw new ForbiddenException('Portal action is not permitted');
    }
    return true;
  }
}
