import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { ExchangeSsoTicketDto } from './dto/exchange-sso-ticket.dto';
import { SsoTicketService } from './sso-ticket.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

@Controller('auth/sso')
export class SsoExchangeController {
  constructor(
    private readonly ticketService: SsoTicketService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  @Post('exchange')
  async exchange(@Body() dto: ExchangeSsoTicketDto) {
    const consumed = await this.ticketService.consumeTicket(dto.ticket);

    const user = await this.prisma.user.findUnique({
      where: { id: consumed.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('SSO user is not active');
    }

    return this.authService.buildLoginResponse(user);
  }
}