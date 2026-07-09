import {
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SamlService } from './saml.service';

@Controller('auth/saml')
export class SamlController {
  constructor(private readonly samlService: SamlService) {}

  @Get(':providerId/login')
  @Redirect()
  async login(@Param('providerId') providerId: string) {
    const url = await this.samlService.buildLoginUrl(providerId);

    return {
      url,
      statusCode: 302,
    };
  }

  @Post(':providerId/acs')
  async acs(
    @Param('providerId') providerId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.samlService.handleAcs(providerId, req.body);

    return res.redirect(302, redirectUrl);
  }

  @Get(':providerId/metadata')
  async metadata(@Param('providerId') providerId: string, @Res() res: Response) {
    const xml = await this.samlService.generateMetadata(providerId);

    res.setHeader('Content-Type', 'application/samlmetadata+xml');
    return res.send(xml);
  }
}