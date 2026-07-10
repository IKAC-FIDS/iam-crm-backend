"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function getResponseRequestId(response, request) {
    const responseHeader = response.getHeader('x-request-id');
    if (Array.isArray(responseHeader)) {
        return String(responseHeader[0] ?? '').trim() || null;
    }
    if (responseHeader !== undefined) {
        return String(responseHeader).trim() || null;
    }
    const requestHeader = request.headers['x-request-id'];
    if (Array.isArray(requestHeader)) {
        return requestHeader[0]?.trim() || null;
    }
    return requestHeader?.trim() || null;
}
function normalizeMessage(message) {
    if (Array.isArray(message)) {
        return message.join('; ');
    }
    if (typeof message === 'string' && message.trim()) {
        return message;
    }
    return 'Unexpected error';
}
function normalizeDetails(message, explicitDetails) {
    if (explicitDetails !== undefined) {
        return explicitDetails;
    }
    if (Array.isArray(message)) {
        return message;
    }
    return undefined;
}
function httpStatusToCode(statusCode) {
    switch (statusCode) {
        case common_1.HttpStatus.BAD_REQUEST:
            return 'BAD_REQUEST';
        case common_1.HttpStatus.UNAUTHORIZED:
            return 'UNAUTHORIZED';
        case common_1.HttpStatus.FORBIDDEN:
            return 'FORBIDDEN';
        case common_1.HttpStatus.NOT_FOUND:
            return 'NOT_FOUND';
        case common_1.HttpStatus.CONFLICT:
            return 'CONFLICT';
        case common_1.HttpStatus.GONE:
            return 'GONE';
        case common_1.HttpStatus.TOO_MANY_REQUESTS:
            return 'RATE_LIMITED';
        case common_1.HttpStatus.UNPROCESSABLE_ENTITY:
            return 'UNPROCESSABLE_ENTITY';
        case common_1.HttpStatus.SERVICE_UNAVAILABLE:
            return 'SERVICE_UNAVAILABLE';
        default:
            return statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'HTTP_ERROR';
    }
}
let ApiExceptionFilter = class ApiExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const normalized = this.normalizeException(exception);
        const body = {
            success: false,
            error: {
                code: normalized.code,
                message: normalized.message,
                ...(normalized.details !== undefined && { details: normalized.details }),
            },
            requestId: getResponseRequestId(response, request),
            timestamp: new Date().toISOString(),
            path: request.originalUrl || request.url,
            method: request.method,
            statusCode: normalized.statusCode,
        };
        response.status(normalized.statusCode).json(body);
    }
    normalizeException(exception) {
        if (exception instanceof common_1.HttpException) {
            const statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                return {
                    statusCode,
                    code: httpStatusToCode(statusCode),
                    message: exceptionResponse,
                };
            }
            const message = exceptionResponse.message ?? exception.message;
            const isValidationError = statusCode === common_1.HttpStatus.BAD_REQUEST &&
                Array.isArray(exceptionResponse.message);
            return {
                statusCode,
                code: exceptionResponse.code ??
                    (isValidationError ? 'VALIDATION_ERROR' : httpStatusToCode(statusCode)),
                message: isValidationError
                    ? 'Validation failed'
                    : normalizeMessage(message),
                details: normalizeDetails(message, exceptionResponse.details),
            };
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            return this.normalizePrismaKnownError(exception);
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                code: 'PRISMA_VALIDATION_ERROR',
                message: 'Database validation error',
            };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
        };
    }
    normalizePrismaKnownError(exception) {
        switch (exception.code) {
            case 'P2002':
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    code: 'UNIQUE_CONSTRAINT_FAILED',
                    message: 'Unique constraint failed',
                    details: exception.meta,
                };
            case 'P2003':
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    code: 'FOREIGN_KEY_CONSTRAINT_FAILED',
                    message: 'Invalid relation reference',
                    details: exception.meta,
                };
            case 'P2025':
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    code: 'RECORD_NOT_FOUND',
                    message: 'Record not found',
                    details: exception.meta,
                };
            default:
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    code: `PRISMA_${exception.code}`,
                    message: 'Database request error',
                    details: exception.meta,
                };
        }
    }
};
exports.ApiExceptionFilter = ApiExceptionFilter;
exports.ApiExceptionFilter = ApiExceptionFilter = __decorate([
    (0, common_1.Catch)()
], ApiExceptionFilter);
//# sourceMappingURL=api-exception.filter.js.map