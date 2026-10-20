"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const platform_authority_module_1 = require("../platform-authority/platform-authority.module");
const api_usage_interceptor_1 = require("./api-usage.interceptor");
const quota_controller_1 = require("./quota.controller");
const platform_quota_service_1 = require("./platform-quota.service");
const quota_resolver_service_1 = require("./quota-resolver.service");
const quota_scheduler_service_1 = require("./quota-scheduler.service");
const quota_service_1 = require("./quota.service");
const usage_reconciliation_service_1 = require("./usage-reconciliation.service");
let QuotaModule = class QuotaModule {
};
exports.QuotaModule = QuotaModule;
exports.QuotaModule = QuotaModule = __decorate([
    (0, common_1.Module)({
        imports: [platform_authority_module_1.PlatformAuthorityModule],
        controllers: [
            quota_controller_1.PlatformPlanQuotaController,
            quota_controller_1.PlatformOrganizationQuotaController,
            quota_controller_1.TenantQuotaController,
        ],
        providers: [
            quota_resolver_service_1.QuotaResolverService,
            quota_service_1.QuotaService,
            platform_quota_service_1.PlatformQuotaService,
            usage_reconciliation_service_1.UsageReconciliationService,
            quota_scheduler_service_1.QuotaSchedulerService,
            { provide: core_1.APP_INTERCEPTOR, useClass: api_usage_interceptor_1.ApiUsageInterceptor },
        ],
        exports: [quota_resolver_service_1.QuotaResolverService, quota_service_1.QuotaService, usage_reconciliation_service_1.UsageReconciliationService],
    })
], QuotaModule);
//# sourceMappingURL=quota.module.js.map