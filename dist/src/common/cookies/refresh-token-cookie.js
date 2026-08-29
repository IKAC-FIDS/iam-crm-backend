"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE_NAME = void 0;
exports.getRefreshTokenFromRequest = getRefreshTokenFromRequest;
exports.setRefreshTokenCookie = setRefreshTokenCookie;
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
exports.buildRefreshTokenCookieOptions = buildRefreshTokenCookieOptions;
const common_1 = require("@nestjs/common");
exports.REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
const logger = new common_1.Logger('RefreshTokenCookie');
let unsafeSameSiteWarningLogged = false;
function getRefreshTokenFromRequest(req) {
    return req.cookies?.[exports.REFRESH_TOKEN_COOKIE_NAME];
}
function setRefreshTokenCookie(res, refreshToken, maxAgeMs) {
    res.cookie(exports.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        ...buildRefreshTokenCookieOptions(),
        maxAge: maxAgeMs,
    });
}
function clearRefreshTokenCookie(res) {
    res.clearCookie(exports.REFRESH_TOKEN_COOKIE_NAME, buildRefreshTokenClearCookieOptions());
}
function buildRefreshTokenCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = parseSecureCookieSetting(process.env.REFRESH_TOKEN_COOKIE_SECURE, isProduction);
    const sameSite = parseSameSiteCookieSetting(process.env.REFRESH_TOKEN_COOKIE_SAME_SITE, isProduction ? 'none' : 'lax');
    if (isProduction && !secure)
        throw new Error('Production refresh cookies require Secure=true');
    if (process.env.REFRESH_TOKEN_COOKIE_SECURE !== undefined && !['true', 'false'].includes(process.env.REFRESH_TOKEN_COOKIE_SECURE)) {
        throw new Error('Invalid REFRESH_TOKEN_COOKIE_SECURE');
    }
    if (process.env.REFRESH_TOKEN_COOKIE_SAME_SITE !== undefined && !['none', 'lax', 'strict'].includes(process.env.REFRESH_TOKEN_COOKIE_SAME_SITE)) {
        throw new Error('Invalid REFRESH_TOKEN_COOKIE_SAME_SITE');
    }
    const path = process.env.REFRESH_TOKEN_COOKIE_PATH ?? '/api/auth';
    if (!['/api/auth', '/api', '/'].includes(path))
        throw new Error('Refresh cookie path must cover /api/auth endpoints');
    if (isProduction && path !== '/api/auth')
        throw new Error('Production refresh cookie path must be /api/auth');
    if (sameSite === 'none' && !secure && !unsafeSameSiteWarningLogged) {
        logger.warn('REFRESH_TOKEN_COOKIE_SAME_SITE=none is configured with REFRESH_TOKEN_COOKIE_SECURE=false; browsers require Secure for SameSite=None and may reject the refresh token cookie.');
        unsafeSameSiteWarningLogged = true;
    }
    return {
        httpOnly: true,
        secure,
        sameSite,
        path,
    };
}
function parseSecureCookieSetting(value, defaultValue) {
    if (value === undefined) {
        return defaultValue;
    }
    return value === 'true';
}
function parseSameSiteCookieSetting(value, defaultValue) {
    if (value === 'lax' || value === 'strict' || value === 'none') {
        return value;
    }
    return defaultValue;
}
function buildRefreshTokenClearCookieOptions() {
    return buildRefreshTokenCookieOptions();
}
//# sourceMappingURL=refresh-token-cookie.js.map