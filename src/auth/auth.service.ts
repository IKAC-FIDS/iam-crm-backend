import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('ایمیل یا رمز عبور نادرست است');
    }

    return this.buildLoginResponse(user);
  }

  async buildLoginResponse(user: User) {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });
    const permissions = rolePermissions.map((rp) => rp.permission.action);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      team: user.team,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        team: user.team,
        permissions,
      },
    };
  }
}
