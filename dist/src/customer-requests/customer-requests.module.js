"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const customer_requests_service_1 = require("./customer-requests.service");
const customer_request_operations_service_1 = require("./customer-request-operations.service");
const customer_requests_controller_1 = require("./customer-requests.controller");
const tasks_module_1 = require("../tasks/tasks.module");
const opportunities_module_1 = require("../opportunities/opportunities.module");
const technical_center_module_1 = require("../technical-center/technical-center.module");
let CustomerRequestsModule = class CustomerRequestsModule {
};
exports.CustomerRequestsModule = CustomerRequestsModule;
exports.CustomerRequestsModule = CustomerRequestsModule = __decorate([
    (0, common_1.Module)({ imports: [tasks_module_1.TasksModule, opportunities_module_1.OpportunitiesModule, technical_center_module_1.TechnicalCenterModule], providers: [customer_requests_service_1.CustomerRequestsService, customer_request_operations_service_1.CustomerRequestOperationsService], controllers: [customer_requests_controller_1.InternalRequestTypesController, customer_requests_controller_1.PortalRequestTypesController, customer_requests_controller_1.PortalRequestsController, customer_requests_controller_1.InternalRequestsController], exports: [customer_requests_service_1.CustomerRequestsService, customer_request_operations_service_1.CustomerRequestOperationsService] })
], CustomerRequestsModule);
//# sourceMappingURL=customer-requests.module.js.map