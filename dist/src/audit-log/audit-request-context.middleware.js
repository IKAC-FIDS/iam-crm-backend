"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRequestContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const audit_request_context_service_1 = require("./audit-request-context.service");
let AuditRequestContextMiddleware = class AuditRequestContextMiddleware {
    constructor(requestContext) {
        this.requestContext = requestContext;
    }
    use(req, res, next) {
        const requestId = this.resolveHeaderValue(req.headers['x-request-id']) || (0, node_crypto_1.randomUUID)();
        const userAgent = this.resolveHeaderValue(req.headers['user-agent']);
        const ipAddress = this.resolveClientIp(req);
        res.setHeader('x-request-id', requestId);
        this.requestContext.run({
            requestId,
            ipAddress,
            userAgent,
            requestMethod: req.method,
            requestPath: req.originalUrl || req.url,
        }, () => next());
    }
    resolveHeaderValue(value) {
        if (Array.isArray(value)) {
            return value[0]?.trim() || null;
        }
        return value?.trim() || null;
    }
    resolveClientIp(req) {
        const forwardedFor = this.resolveHeaderValue(req.headers['x-forwarded-for']);
        if (forwardedFor) {
            return forwardedFor.split(',')[0]?.trim() || null;
        }
        const realIp = this.resolveHeaderValue(req.headers['x-real-ip']);
        if (realIp) {
            return realIp;
        }
        return req.ip || req.socket?.remoteAddress || null;
    }
};
exports.AuditRequestContextMiddleware = AuditRequestContextMiddleware;
exports.AuditRequestContextMiddleware = AuditRequestContextMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_request_context_service_1.AuditRequestContextService])
], AuditRequestContextMiddleware);
//# sourceMappingURL=audit-request-context.middleware.js.map