"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const node_crypto_1 = require("node:crypto");
const app_module_1 = require("./app.module");
const refresh_token_cookie_1 = require("./common/cookies/refresh-token-cookie");
const api_exception_filter_1 = require("./common/filters/api-exception.filter");
const api_response_interceptor_1 = require("./common/interceptors/api-response.interceptor");
const openapi_runtime_1 = require("./openapi/openapi.runtime");
function parseCorsOrigins(value) {
    return (value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    (0, refresh_token_cookie_1.buildRefreshTokenCookieOptions)();
    const httpAdapter = app.getHttpAdapter().getInstance();
    const corsLogger = new common_1.Logger('Cors');
    httpAdapter.set('trust proxy', 1);
    app.use((req, res, next) => {
        const suppliedRequestId = req.header('x-request-id')?.trim();
        const requestId = suppliedRequestId || (0, node_crypto_1.randomUUID)();
        req.requestId = requestId;
        res.setHeader('x-request-id', requestId);
        next();
    });
    app.use((0, cookie_parser_1.default)());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
    const allowedOrigins = parseCorsOrigins(config.get('CORS_ORIGINS', 'http://localhost:5173'));
    const corsCredentials = config.get('CORS_CREDENTIALS', true);
    if (corsCredentials && allowedOrigins.includes('*')) {
        throw new Error('CORS_ORIGINS must not contain "*" when CORS_CREDENTIALS is enabled');
    }
    app.use((req, res, next) => {
        const origin = req.header('origin');
        if (!origin || allowedOrigins.includes(origin)) {
            next();
            return;
        }
        const requestId = req.requestId ?? null;
        const context = {
            requestId,
            origin,
            method: req.method,
            url: req.originalUrl || req.url,
            allowedOriginsCount: allowedOrigins.length,
            allowedOrigins,
        };
        corsLogger.warn('CORS origin rejected', JSON.stringify(context));
        res.status(403).json({
            success: false,
            error: {
                code: 'CORS_ORIGIN_REJECTED',
                message: 'Request origin is not allowed',
            },
            requestId,
            timestamp: new Date().toISOString(),
            path: req.originalUrl || req.url,
            method: req.method,
            statusCode: 403,
        });
    });
    app.enableCors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Request origin is not allowed'), false);
        },
        credentials: corsCredentials,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-request-id',
        ],
        exposedHeaders: [
            'x-request-id',
            'Content-Disposition',
            'Content-Length',
            'Content-Type',
        ],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalInterceptors(new api_response_interceptor_1.ApiResponseInterceptor());
    app.useGlobalFilters(new api_exception_filter_1.ApiExceptionFilter());
    app.setGlobalPrefix('api');
    const runtimeDocsEnabled = config.get('OPENAPI_RUNTIME_ENABLED', false);
    (0, openapi_runtime_1.configureRuntimeOpenApi)(app, runtimeDocsEnabled);
    const port = config.get('PORT', 3000);
    await app.listen(port);
    console.log(`IAM CRM API is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map