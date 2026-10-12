import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomerAccessService } from './customer-access.service';

interface Payload {
  sub?: string;
  email?: string;
  principalType?: string;
  customerMembershipId?: string;
}

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(config: ConfigService, private readonly access: CustomerAccessService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      audience: 'neshane-op-portal',
    });
  }

  async validate(payload: Payload) {
    if (!payload.sub || !payload.email || payload.principalType !== 'CUSTOMER' || !payload.customerMembershipId) {
      throw new UnauthorizedException('Invalid portal token');
    }
    const membership = await this.access.resolve(payload.sub, payload.customerMembershipId);
    return {
      userId: membership.userId,
      email: membership.user.email,
      principalType: 'CUSTOMER' as const,
      organizationId: membership.organizationId,
      companyId: membership.companyId,
      membershipId: membership.id,
      role: membership.role,
    };
  }
}
