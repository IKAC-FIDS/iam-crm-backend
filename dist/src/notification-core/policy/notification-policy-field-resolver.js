"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveNotificationPolicyField = resolveNotificationPolicyField;
const forbidden = new Set(["__proto__", "prototype", "constructor"]);
const safePath = /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*){1,4}$/;
function resolveNotificationPolicyField(context, path) {
    if (path.length > 120 || !safePath.test(path))
        return undefined;
    const parts = path.split(".");
    if (parts.some(part => forbidden.has(part)))
        return undefined;
    let current = context;
    for (const part of parts) {
        if (current === null || typeof current !== "object" || Array.isArray(current) || !Object.prototype.hasOwnProperty.call(current, part))
            return undefined;
        current = current[part];
    }
    return current;
}
//# sourceMappingURL=notification-policy-field-resolver.js.map