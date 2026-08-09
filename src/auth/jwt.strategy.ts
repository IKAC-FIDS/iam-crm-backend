import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { RequestWithRequestId } from '../common/logging/http-log-context';
import { TenantResolverService } from '../organization-memberships/tenant-resolver.service';

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  team?: string | null;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
  organizationId?: string | null;
  activeOrganizationId?: string | null;
  membershipId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly tenantResolver: TenantResolverService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (!payload?.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const requestId = (req as RequestWithRequestId).requestId ?? null;
    const effective = await this.tenantResolver
      .resolveAuthenticatedTenant(payload.sub, {
        claims: {
          activeOrganizationId: payload.activeOrganizationId,
          membershipId: payload.membershipId,
        },
        requestId,
      })
      .catch(() => {
        throw new UnauthorizedException('No active organization membership');
      });

    return {
      userId: payload.sub,
      email: payload.email,
      role: effective.role,
      roleId: effective.roleId,
      team: effective.team,
      teamId: effective.teamId,
      teamCode: effective.teamCode,
      teamName: effective.teamName,
      organizationId: effective.organizationId,
      activeOrganizationId: effective.organizationId,
      membershipId: effective.membershipId,
      tenantResolutionSource: effective.resolutionSource,
      tenantContext: effective,
    };
  }
}
