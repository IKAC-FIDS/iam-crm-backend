import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationMembershipsService } from '../organization-memberships/organization-memberships.service';

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  team?: string | null;
  teamId?: string | null;
  teamCode?: string | null;
  teamName?: string | null;
  organizationId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly memberships: OrganizationMembershipsService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        roleId: true,
        team: true,
        teamId: true,
        teamRef: {
          select: {
            code: true,
            name: true,
          },
        },
        organizationId: true,
        isActive: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const effective = await this.memberships
      .resolveEffectiveContext({
        ...user,
      })
      .catch(() => {
        throw new UnauthorizedException('No active organization membership');
      });

    return {
      userId: user.id,
      email: user.email,
      role: effective.role,
      roleId: effective.roleId,
      team: effective.team,
      teamId: effective.teamId,
      teamCode: effective.teamCode,
      teamName: effective.teamName,
      organizationId: effective.organizationId,
      membershipId: effective.membershipId,
      tenantResolutionSource: effective.source,
    };
  }
}
