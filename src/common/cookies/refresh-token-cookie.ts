import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

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

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  };
}

function buildRefreshTokenClearCookieOptions(): CookieOptions {
  return buildRefreshTokenCookieOptions();
}