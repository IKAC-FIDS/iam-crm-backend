"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestId = getRequestId;
exports.buildHttpLogContext = buildHttpLogContext;
exports.resolveHeaderValue = resolveHeaderValue;
const redact_sensitive_data_1 = require("./redact-sensitive-data");
function getRequestId(req, res) {
    if (req.requestId) {
        return req.requestId;
    }
    const responseHeader = res?.getHeader('x-request-id');
    if (Array.isArray(responseHeader)) {
        return String(responseHeader[0] ?? '').trim() || null;
    }
    if (responseHeader !== undefined) {
        return String(responseHeader).trim() || null;
    }
    return resolveHeaderValue(req.headers['x-request-id']);
}
function buildHttpLogContext(req, res) {
    return {
        requestId: getRequestId(req, res),
        method: req.method,
        originalUrl: req.originalUrl,
        url: req.url,
        routePath: req.route?.path ?? null,
        statusCode: res?.statusCode ?? null,
        ip: req.ip ?? req.socket?.remoteAddress ?? null,
        xForwardedFor: resolveHeaderValue(req.headers['x-forwarded-for']),
        xRealIp: resolveHeaderValue(req.headers['x-real-ip']),
        origin: resolveHeaderValue(req.headers.origin),
        referer: resolveHeaderValue(req.headers.referer),
        userAgent: resolveHeaderValue(req.headers['user-agent']),
        contentType: resolveHeaderValue(req.headers['content-type']),
        contentLength: resolveHeaderValue(req.headers['content-length']),
        host: resolveHeaderValue(req.headers.host),
        body: req.method === 'GET' ? undefined : (0, redact_sensitive_data_1.redactSensitiveData)(req.body),
        query: (0, redact_sensitive_data_1.redactSensitiveData)(req.query),
        params: (0, redact_sensitive_data_1.redactSensitiveData)(req.params),
    };
}
function resolveHeaderValue(value) {
    if (Array.isArray(value)) {
        return value[0]?.trim() || null;
    }
    return value?.trim() || null;
}
//# sourceMappingURL=http-log-context.js.map