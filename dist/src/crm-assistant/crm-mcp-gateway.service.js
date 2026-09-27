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
exports.CrmMcpGatewayService = void 0;
const common_1 = require("@nestjs/common");
const crm_assistant_actions_service_1 = require("./crm-assistant-actions.service");
const crm_assistant_tools_service_1 = require("./crm-assistant-tools.service");
let CrmMcpGatewayService = class CrmMcpGatewayService {
    constructor(tools, actions) {
        this.tools = tools;
        this.actions = actions;
    }
    listFor(user) {
        return [...this.tools.listFor(user), ...this.actions.listFor(user)];
    }
    async call(name, args, user) {
        return name.startsWith('propose_')
            ? this.actions.propose(name, args, user)
            : this.tools.call(name, args, user);
    }
    isAction(name) {
        return name.startsWith('propose_');
    }
};
exports.CrmMcpGatewayService = CrmMcpGatewayService;
exports.CrmMcpGatewayService = CrmMcpGatewayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_assistant_tools_service_1.CrmAssistantToolsService,
        crm_assistant_actions_service_1.CrmAssistantActionsService])
], CrmMcpGatewayService);
//# sourceMappingURL=crm-mcp-gateway.service.js.map