import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'REP' | 'BOARDS';
  team?: string | null;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
  organizationId?: string | null;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
