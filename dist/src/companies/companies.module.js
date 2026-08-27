"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesModule = void 0;
const common_1 = require("@nestjs/common");
const companies_service_1 = require("./companies.service");
const companies_controller_1 = require("./companies.controller");
const pipeline_config_module_1 = require("../admin/pipeline/pipeline-config.module");
const attachments_module_1 = require("../attachments/attachments.module");
const company_legal_documents_controller_1 = require("./company-legal-documents.controller");
const company_legal_documents_service_1 = require("./company-legal-documents.service");
const quota_module_1 = require("../quota/quota.module");
const company_overview_controller_1 = require("./company-overview.controller");
const company_overview_service_1 = require("./company-overview.service");
let CompaniesModule = class CompaniesModule {
};
exports.CompaniesModule = CompaniesModule;
exports.CompaniesModule = CompaniesModule = __decorate([
    (0, common_1.Module)({
        imports: [pipeline_config_module_1.PipelineConfigModule, attachments_module_1.AttachmentsModule, quota_module_1.QuotaModule],
        providers: [
            companies_service_1.CompaniesService,
            company_legal_documents_service_1.CompanyLegalDocumentsService,
            company_overview_service_1.CompanyOverviewService,
        ],
        controllers: [
            companies_controller_1.CompaniesController,
            company_legal_documents_controller_1.CompanyLegalDocumentsController,
            company_overview_controller_1.CompanyOverviewController,
        ],
        exports: [companies_service_1.CompaniesService, company_overview_service_1.CompanyOverviewService],
    })
], CompaniesModule);
//# sourceMappingURL=companies.module.js.map