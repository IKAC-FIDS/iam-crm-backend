"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmAssistantModule = void 0;
const common_1 = require("@nestjs/common");
const companies_module_1 = require("../companies/companies.module");
const meetings_module_1 = require("../meetings/meetings.module");
const opportunities_module_1 = require("../opportunities/opportunities.module");
const tasks_module_1 = require("../tasks/tasks.module");
const crm_assistant_controller_1 = require("./crm-assistant.controller");
const crm_assistant_service_1 = require("./crm-assistant.service");
const crm_assistant_tools_service_1 = require("./crm-assistant-tools.service");
const crm_mcp_controller_1 = require("./crm-mcp.controller");
const crm_assistant_actions_service_1 = require("./crm-assistant-actions.service");
let CrmAssistantModule = class CrmAssistantModule {
};
exports.CrmAssistantModule = CrmAssistantModule;
exports.CrmAssistantModule = CrmAssistantModule = __decorate([
    (0, common_1.Module)({
        imports: [companies_module_1.CompaniesModule, opportunities_module_1.OpportunitiesModule, tasks_module_1.TasksModule, meetings_module_1.MeetingsModule],
        controllers: [crm_assistant_controller_1.CrmAssistantController, crm_mcp_controller_1.CrmMcpController],
        providers: [crm_assistant_service_1.CrmAssistantService, crm_assistant_tools_service_1.CrmAssistantToolsService, crm_assistant_actions_service_1.CrmAssistantActionsService],
    })
], CrmAssistantModule);
//# sourceMappingURL=crm-assistant.module.js.map