"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redactSensitiveData = redactSensitiveData;
const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'currentpassword',
    'newpassword',
    'confirmpassword',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
    'cookie',
    'set-cookie',
    'secret',
    'jwt',
    'jwtsecret',
    'apikey',
    'privatekey',
]);
function redactSensitiveData(value) {
    return redactValue(value, new WeakSet());
}
function redactValue(value, seen) {
    if (value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        if (seen.has(value)) {
            return '[Circular]';
        }
        seen.add(value);
        return value.map((item) => redactValue(item, seen));
    }
    if (typeof value !== 'object') {
        return value;
    }
    if (seen.has(value)) {
        return '[Circular]';
    }
    seen.add(value);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveKey(key) ? REDACTED : redactValue(item, seen),
    ]));
}
function isSensitiveKey(key) {
    const normalized = key.replace(/[_\s-]/g, '').toLowerCase();
    return SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(normalized);
}
//# sourceMappingURL=redact-sensitive-data.js.map