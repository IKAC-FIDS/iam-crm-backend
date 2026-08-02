import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'REP' | 'BOARDS';
  roleId?: string | null;
  team?: string | null;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
  organizationId?: string | null;
  membershipId?: string | null;
  tenantResolutionSource?:
    | 'authenticated-membership'
    | 'migration-compatibility';
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
