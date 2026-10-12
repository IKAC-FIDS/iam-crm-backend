import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { clearPortalRefreshToken, getPortalRefreshToken, setPortalRefreshToken } from '../common/cookies/portal-refresh-token-cookie';
import { CookieOriginGuard } from '../common/guards/cookie-origin.guard';
import { CurrentPortalPrincipal } from '../customer-access/current-portal-principal.decorator';
import { PortalJwtAuthGuard } from '../customer-access/portal-jwt-auth.guard';
import type { PortalPrincipal } from '../customer-access/portal-principal';
import { AcceptCustomerInvitationDto, PortalLoginDto, PortalSelectCompanyDto, PortalSwitchCompanyDto } from './dto/portal-auth.dto';
import { PortalAuthService } from './portal-auth.service';

@Controller('portal/auth')
@UseGuards(CookieOriginGuard)
export class PortalAuthController {
  constructor(private readonly service: PortalAuthService) {}

  @Post('login') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: PortalLoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.service.login(dto, req), res);
  }

  @Post('select-company') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60000 } })
  async select(@Body() dto: PortalSelectCompanyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.service.selectCompany(dto.selectionToken, dto.companyId, req), res);
  }

  @Post('refresh') @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = getPortalRefreshToken(req);
    if (!token) throw new UnauthorizedException('Refresh token is missing');
    return this.respond(await this.service.refresh(token, req), res);
  }

  @Post('switch-company') @HttpCode(200) @UseGuards(PortalJwtAuthGuard)
  async switchCompany(@CurrentPortalPrincipal() principal: PortalPrincipal, @Body() dto: PortalSwitchCompanyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = getPortalRefreshToken(req);
    if (!token) throw new UnauthorizedException('Refresh token is missing');
    return this.respond(await this.service.switchCompany(principal, dto.companyId, token, req), res);
  }

  @Get('session') @UseGuards(PortalJwtAuthGuard)
  session(@CurrentPortalPrincipal() principal: PortalPrincipal) { return principal; }

  @Get('companies') @UseGuards(PortalJwtAuthGuard)
  companies(@CurrentPortalPrincipal() principal: PortalPrincipal) { return this.service.companies(principal.userId); }

  @Post('accept-invitation') @HttpCode(200) @Throttle({ default: { limit: 5, ttl: 60000 } })
  async accept(@Body() dto: AcceptCustomerInvitationDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(await this.service.acceptInvitation(dto, req), res);
  }

  @Post('logout') @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.service.logout(getPortalRefreshToken(req)); clearPortalRefreshToken(res); return { success: true };
  }

  @Post('logout-all') @HttpCode(200) @UseGuards(PortalJwtAuthGuard)
  async logoutAll(@CurrentPortalPrincipal() principal: PortalPrincipal, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.logoutAll(principal.userId); clearPortalRefreshToken(res); return { success: true, ...result };
  }

  private respond(result: any, res: Response) {
    if (result.refreshToken) setPortalRefreshToken(res, result.refreshToken, result.refreshTokenMaxAgeMs);
    return this.service.publicResponse(result);
  }
}
