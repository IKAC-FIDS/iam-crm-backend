"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE_NAME = void 0;
exports.getRefreshTokenFromRequest = getRefreshTokenFromRequest;
exports.setRefreshTokenCookie = setRefreshTokenCookie;
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
exports.REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
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
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/api/auth',
    };
}
function buildRefreshTokenClearCookieOptions() {
    return buildRefreshTokenCookieOptions();
}
//# sourceMappingURL=refresh-token-cookie.js.map