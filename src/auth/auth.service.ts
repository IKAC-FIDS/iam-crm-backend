import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenService } from './refresh-token.service';

export interface AuthUserResponse {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  team: string | null;
  teamId: string | null;
  teamCode: string | null;
  teamName: string | null;
  organizationId: string | null;
  permissions: string[];
}

export interface AuthAccessResponse {
  accessToken: string;
  accessTokenExpiresIn: string;
  user: AuthUserResponse;
}

export interface AuthSessionLoginResponse extends AuthAccessResponse {
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
  refreshTokenExpiresAt: Date;
  refreshSessionId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, req?: Request): Promise<AuthSessionLoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'حساب کاربری موقتاً قفل شده است. لطفاً بعداً دوباره تلاش کنید',
      );
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      await this.recordFailedLogin(user.id, user.failedLoginAttempts);
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    await this.recordSuccessfulLogin(user.id, req);

    return this.buildSessionLoginResponse(user, req);
  }

  async refresh(
    refreshToken: string,
    req?: Request,
  ): Promise<AuthSessionLoginResponse> {
    const rotated = await this.refreshTokenService.rotateRefreshToken(
      refreshToken,
      req,
    );

    const accessResponse = await this.buildLoginResponse(rotated.user);

    return {
      ...accessResponse,
      refreshToken: rotated.refreshToken,
      refreshTokenMaxAgeMs: rotated.refreshTokenMaxAgeMs,
      refreshTokenExpiresAt: rotated.refreshTokenExpiresAt,
      refreshSessionId: rotated.refreshSessionId,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.refreshTokenService.revokeByToken(refreshToken, 'LOGOUT');
  }

  async logoutAll(userId: string): Promise<{ revokedCount: number }> {
    const revokedCount = await this.refreshTokenService.revokeAllUserSessions(
      userId,
      'LOGOUT_ALL',
    );

    return { revokedCount };
  }

  async buildSessionLoginResponse(
    user: User,
    req?: Request,
  ): Promise<AuthSessionLoginResponse> {
    const accessResponse = await this.buildLoginResponse(user);

    const refreshSession = await this.refreshTokenService.createSession(
      user.id,
      req,
    );

    return {
      ...accessResponse,
      ...refreshSession,
    };
  }

  async buildLoginResponse(user: User): Promise<AuthAccessResponse> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });

    const permissions = rolePermissions.map((rp) => rp.permission.action);
    const team = user.teamId
      ? await this.prisma.team.findUnique({
          where: { id: user.teamId },
          select: { id: true, code: true, name: true },
        })
      : null;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      team: user.team,
      teamId: team?.id ?? user.teamId,
      teamCode: team?.code ?? user.team ?? null,
      teamName: team?.name ?? null,
      organizationId: user.organizationId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      accessTokenExpiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        team: user.team,
        teamId: team?.id ?? user.teamId,
        teamCode: team?.code ?? user.team ?? null,
        teamName: team?.name ?? null,
        organizationId: user.organizationId,
        permissions,
      },
    };
  }

  toPublicAuthResponse(result: AuthSessionLoginResponse): AuthAccessResponse {
    const {
      refreshToken,
      refreshTokenMaxAgeMs,
      refreshTokenExpiresAt,
      refreshSessionId,
      ...publicResponse
    } = result;

    void refreshToken;
    void refreshTokenMaxAgeMs;
    void refreshTokenExpiresAt;
    void refreshSessionId;

    return publicResponse;
  }

  private async recordFailedLogin(
    userId: string,
    currentFailedAttempts: number,
  ): Promise<void> {
    const nextFailedAttempts = currentFailedAttempts + 1;
    const shouldLock = nextFailedAttempts >= 5;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: nextFailedAttempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null,
      },
    });
  }

  private async recordSuccessfulLogin(
    userId: string,
    req?: Request,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: this.extractIpAddress(req),
      },
    });
  }

  private extractIpAddress(req?: Request): string | null {
    const forwardedFor = req?.headers['x-forwarded-for'];

    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0]?.split(',')[0]?.trim() || null;
    }

    if (typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0]?.trim() || null;
    }

    return req?.ip || req?.socket?.remoteAddress || null;
  }
}
