"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORTAL_REFRESH_TOKEN_COOKIE_NAME = void 0;
exports.getPortalRefreshToken = getPortalRefreshToken;
exports.setPortalRefreshToken = setPortalRefreshToken;
exports.clearPortalRefreshToken = clearPortalRefreshToken;
const refresh_token_cookie_1 = require("./refresh-token-cookie");
exports.PORTAL_REFRESH_TOKEN_COOKIE_NAME = 'portalRefreshToken';
function options() {
    return { ...(0, refresh_token_cookie_1.buildRefreshTokenCookieOptions)(), path: '/api/portal/auth' };
}
function getPortalRefreshToken(req) {
    return req.cookies?.[exports.PORTAL_REFRESH_TOKEN_COOKIE_NAME];
}
function setPortalRefreshToken(res, token, maxAge) {
    res.cookie(exports.PORTAL_REFRESH_TOKEN_COOKIE_NAME, token, { ...options(), maxAge });
}
function clearPortalRefreshToken(res) {
    res.clearCookie(exports.PORTAL_REFRESH_TOKEN_COOKIE_NAME, options());
}
//# sourceMappingURL=portal-refresh-token-cookie.js.map