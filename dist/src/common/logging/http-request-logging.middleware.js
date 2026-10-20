"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpRequestLoggingMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRequestLoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const http_log_context_1 = require("./http-log-context");
let HttpRequestLoggingMiddleware = HttpRequestLoggingMiddleware_1 = class HttpRequestLoggingMiddleware {
    constructor() {
        this.logger = new common_1.Logger(HttpRequestLoggingMiddleware_1.name);
    }
    use(req, res, next) {
        const startedAt = Date.now();
        res.on('finish', () => {
            const context = {
                ...(0, http_log_context_1.buildHttpLogContext)(req, res),
                durationMs: Date.now() - startedAt,
            };
            const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${context.durationMs}ms requestId=${context.requestId ?? 'none'}`;
            if (res.statusCode >= 500) {
                this.logger.error(message, JSON.stringify(context));
                return;
            }
            if (res.statusCode >= 400) {
                this.logger.warn(message, JSON.stringify(context));
                return;
            }
            this.logger.log(message, JSON.stringify(context));
        });
        next();
    }
};
exports.HttpRequestLoggingMiddleware = HttpRequestLoggingMiddleware;
exports.HttpRequestLoggingMiddleware = HttpRequestLoggingMiddleware = HttpRequestLoggingMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], HttpRequestLoggingMiddleware);
//# sourceMappingURL=http-request-logging.middleware.js.map