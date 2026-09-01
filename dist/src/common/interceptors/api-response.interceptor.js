"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const financial_visibility_1 = require("../financial/financial-visibility");
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isAlreadyStandardResponse(value) {
    return isObject(value) && typeof value.success === "boolean";
}
function isPaginatedPayload(value) {
    if (!isObject(value)) {
        return false;
    }
    const keys = Object.keys(value);
    return keys.length === 2 && keys.includes("data") && keys.includes("meta");
}
function getResponseRequestId(response) {
    const header = response.getHeader("x-request-id");
    if (Array.isArray(header)) {
        return String(header[0] ?? "").trim() || null;
    }
    if (header !== undefined) {
        return String(header).trim() || null;
    }
    return null;
}
let ApiResponseInterceptor = class ApiResponseInterceptor {
    intercept(context, next) {
        const response = context.switchToHttp().getResponse();
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, rxjs_1.map)((payload) => {
            if (payload instanceof common_1.StreamableFile) {
                return payload;
            }
            const visiblePayload = (0, financial_visibility_1.redactFinancialResponse)(payload, request.user);
            if (isAlreadyStandardResponse(visiblePayload)) {
                return visiblePayload;
            }
            const base = {
                success: true,
                requestId: getResponseRequestId(response),
                timestamp: new Date().toISOString(),
            };
            if (isPaginatedPayload(visiblePayload)) {
                const result = {
                    ...base,
                    data: visiblePayload.data,
                    meta: visiblePayload.meta,
                };
                return result;
            }
            const result = {
                ...base,
                data: visiblePayload ?? null,
            };
            return result;
        }));
    }
};
exports.ApiResponseInterceptor = ApiResponseInterceptor;
exports.ApiResponseInterceptor = ApiResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ApiResponseInterceptor);
//# sourceMappingURL=api-response.interceptor.js.map