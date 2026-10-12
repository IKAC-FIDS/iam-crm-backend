import type { CookieOptions, Request, Response } from 'express';
import { buildRefreshTokenCookieOptions } from './refresh-token-cookie';

export const PORTAL_REFRESH_TOKEN_COOKIE_NAME = 'portalRefreshToken';

type RequestWithCookies = Request & { cookies?: Record<string, string | undefined> };

function options(): CookieOptions {
  return { ...buildRefreshTokenCookieOptions(), path: '/api/portal/auth' };
}

export function getPortalRefreshToken(req: Request): string | undefined {
  return (req as RequestWithCookies).cookies?.[PORTAL_REFRESH_TOKEN_COOKIE_NAME];
}

export function setPortalRefreshToken(res: Response, token: string, maxAge: number) {
  res.cookie(PORTAL_REFRESH_TOKEN_COOKIE_NAME, token, { ...options(), maxAge });
}

export function clearPortalRefreshToken(res: Response) {
  res.clearCookie(PORTAL_REFRESH_TOKEN_COOKIE_NAME, options());
}
