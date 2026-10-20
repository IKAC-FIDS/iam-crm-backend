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
exports.ApiUsageInterceptor = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const quota_service_1 = require("./quota.service");
let ApiUsageInterceptor = class ApiUsageInterceptor {
    constructor(quota) {
        this.quota = quota;
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const tenant = request.user?.tenantContext;
        const path = request.originalUrl || request.url;
        if (tenant && !path.startsWith('/api/health')) {
            const key = request.requestId
                ? `http:${request.requestId}`
                : `http:${tenant.userId}:${request.method}:${path}:${Date.now()}`;
            await this.quota.consumeEvent(tenant.organizationId, client_1.QuotaMetric.API_CALLS, 1n, key, new Date(), tenant.userId, request.requestId);
        }
        return next.handle();
    }
};
exports.ApiUsageInterceptor = ApiUsageInterceptor;
exports.ApiUsageInterceptor = ApiUsageInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [quota_service_1.QuotaService])
], ApiUsageInterceptor);
//# sourceMappingURL=api-usage.interceptor.js.map