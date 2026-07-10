"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunitiesModule = void 0;
const common_1 = require("@nestjs/common");
const pipeline_config_module_1 = require("../admin/pipeline/pipeline-config.module");
const company_opportunities_controller_1 = require("./company-opportunities.controller");
const opportunity_commercial_documents_controller_1 = require("./opportunity-commercial-documents.controller");
const opportunity_commercial_documents_service_1 = require("./opportunity-commercial-documents.service");
const opportunity_line_items_controller_1 = require("./opportunity-line-items.controller");
const opportunity_line_items_service_1 = require("./opportunity-line-items.service");
const opportunity_payments_controller_1 = require("./opportunity-payments.controller");
const opportunity_payments_service_1 = require("./opportunity-payments.service");
const opportunities_controller_1 = require("./opportunities.controller");
const opportunities_service_1 = require("./opportunities.service");
let OpportunitiesModule = class OpportunitiesModule {
};
exports.OpportunitiesModule = OpportunitiesModule;
exports.OpportunitiesModule = OpportunitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [pipeline_config_module_1.PipelineConfigModule],
        controllers: [
            opportunities_controller_1.OpportunitiesController,
            company_opportunities_controller_1.CompanyOpportunitiesController,
            opportunity_line_items_controller_1.OpportunityLineItemsController,
            opportunity_commercial_documents_controller_1.OpportunityCommercialDocumentsController,
            opportunity_payments_controller_1.OpportunityPaymentsController,
        ],
        providers: [
            opportunities_service_1.OpportunitiesService,
            opportunity_line_items_service_1.OpportunityLineItemsService,
            opportunity_commercial_documents_service_1.OpportunityCommercialDocumentsService,
            opportunity_payments_service_1.OpportunityPaymentsService,
        ],
        exports: [
            opportunities_service_1.OpportunitiesService,
        ],
    })
], OpportunitiesModule);
//# sourceMappingURL=opportunities.module.js.map