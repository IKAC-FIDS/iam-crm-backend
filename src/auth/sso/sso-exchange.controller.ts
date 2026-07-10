import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth.service';
import {
  setRefreshTokenCookie,
} from '../../common/cookies/refresh-token-cookie';
import { ExchangeSsoTicketDto } from './dto/exchange-sso-ticket.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SsoTicketService } from './sso-ticket.service';

@Controller('auth/sso')
export class SsoExchangeController {
  constructor(
    private readonly ticketService: SsoTicketService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Post('exchange')
  async exchange(
    @Body() dto: ExchangeSsoTicketDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const consumed = await this.ticketService.consumeTicket(dto.ticket);

    const user = await this.prisma.user.findUnique({
      where: { id: consumed.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('SSO user is not active');
    }

    const result = await this.authService.buildSessionLoginResponse(user, req);

    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );

    return this.authService.toPublicAuthResponse(result);
  }
}