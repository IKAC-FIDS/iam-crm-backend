import type { CookieOptions, Request, Response } from 'express';
import { Logger } from '@nestjs/common';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const logger = new Logger('RefreshTokenCookie');
let unsafeSameSiteWarningLogged = false;

type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

export function getRefreshTokenFromRequest(
  req: Request,
): string | undefined {
  return (req as RequestWithCookies).cookies?.[REFRESH_TOKEN_COOKIE_NAME];
}

export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  maxAgeMs: number,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    ...buildRefreshTokenCookieOptions(),
    maxAge: maxAgeMs,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(
    REFRESH_TOKEN_COOKIE_NAME,
    buildRefreshTokenClearCookieOptions(),
  );
}

function buildRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const secure = parseSecureCookieSetting(
    process.env.REFRESH_TOKEN_COOKIE_SECURE,
    isProduction,
  );
  const sameSite = parseSameSiteCookieSetting(
    process.env.REFRESH_TOKEN_COOKIE_SAME_SITE,
    isProduction ? 'none' : 'lax',
  );

  if (sameSite === 'none' && !secure && !unsafeSameSiteWarningLogged) {
    logger.warn(
      'REFRESH_TOKEN_COOKIE_SAME_SITE=none is configured with REFRESH_TOKEN_COOKIE_SECURE=false; browsers require Secure for SameSite=None and may reject the refresh token cookie.',
    );
    unsafeSameSiteWarningLogged = true;
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: process.env.REFRESH_TOKEN_COOKIE_PATH ?? '/api/auth',
  };
}

function parseSecureCookieSetting(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true';
}

function parseSameSiteCookieSetting(
  value: string | undefined,
  defaultValue: 'lax' | 'strict' | 'none',
): 'lax' | 'strict' | 'none' {
  if (value === 'lax' || value === 'strict' || value === 'none') {
    return value;
  }

  return defaultValue;
}

function buildRefreshTokenClearCookieOptions(): CookieOptions {
  return buildRefreshTokenCookieOptions();
}
