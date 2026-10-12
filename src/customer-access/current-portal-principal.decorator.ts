import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PortalPrincipal } from './portal-principal';

export const CurrentPortalPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PortalPrincipal =>
    ctx.switchToHttp().getRequest().user,
);
